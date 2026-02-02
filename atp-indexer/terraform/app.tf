#
# ACM Certificate + DNS (creates cert, validates, and creates A record)
#
locals {
  create_dns_record = false
}
module "domain" {
  source = "../../terraform/modules/acm-certificate"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  domain_name               = "indexer.${var.env}.stake.aztec.network"
  subject_alternative_names = []
  hosted_zone_name          = "aztec.network"

  # DNS record will be created after CloudFront distribution
  create_dns_record      = local.create_dns_record
  cloudfront_domain_name = aws_cloudfront_distribution.cf.domain_name
  cloudfront_zone_id     = aws_cloudfront_distribution.cf.hosted_zone_id

  tags = local.common_tags
}

#
# ECR Repository
#
resource "aws_ecr_repository" "atp_indexer" {
  name                 = "${local.full_name}-atp-indexer"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = local.full_name
    Type = "container-registry"
  })
}

resource "aws_cloudwatch_log_group" "atp_indexer" {
  name              = "/ecs/${local.full_name}-atp-indexer"
  retention_in_days = var.logs_retention_in_days
}

resource "aws_cloudwatch_log_group" "atp_server" {
  name              = "/ecs/${local.full_name}-atp-server"
  retention_in_days = var.logs_retention_in_days
}

resource "aws_iam_role" "task_execution" {
  name               = "${local.full_name}-task-exec"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
}

data "aws_iam_policy_document" "task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "task_exec_policy" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task_role" {
  name               = "${local.full_name}-task-role"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
}

module "security_groups" {
  source = "../../terraform/modules/security-groups"

  name_prefix    = local.full_name
  vpc_id         = local.vpc_id
  vpc_cidr       = local.vpc_cidr
  container_port = var.container_port
  common_tags    = local.common_tags
}

resource "aws_lb" "atp" {
  name               = "${local.full_name}-atp"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [module.security_groups.lb_security_group_id]
  subnets            = [local.public_subnet_1_id, local.public_subnet_2_id]

  tags = {
    Name        = "${local.full_name}-atp"
    Environment = var.env
  }
}

resource "aws_lb_target_group" "atp_server" {
  name_prefix          = "atp-"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = local.vpc_id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${local.full_name}-atp-server"
    Environment = var.env
  }
}

resource "aws_lb_listener" "atp" {
  load_balancer_arn = aws_lb.atp.arn
  port              = 80
  protocol          = "HTTP"


  # Default: block all requests
  default_action {
    type = "fixed-response"
    fixed_response {
      status_code  = "403"
      content_type = "text/plain"
      message_body = "Access Denied: Forbidden"
    }
  }

}

resource "aws_lb_listener_rule" "allow_from_cloudfront" {
  count        = local.cloudfront_secret_header_ssm_name != "" ? 1 : 0
  listener_arn = aws_lb_listener.atp.arn
  priority     = 1

  condition {
    http_header {
      http_header_name = local.cloudfront_secret_header_name
      values           = [data.aws_ssm_parameter.cloudfront_secret_header[0].value]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.atp_server.arn
  }
}

resource "aws_security_group" "atp_indexer" {
  name_prefix = "${local.full_name}-atp-indexer-sg"
  vpc_id      = local.vpc_id

  # TODO(md): confirm if this is needed
  egress {
    description = "Allow HTTPS for RPC calls"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow JSON-RPC to external node"
    from_port   = 8545
    to_port     = 8545
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # TODO: if running our own node - hardcode that allowed addr here
  }

  egress {
    description     = "TO RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.atp_db.id]
  }

  tags = merge(local.common_tags, {
    Name        = "${local.full_name}-atp-indexer"
    Environment = var.env
  })
}

resource "aws_security_group" "atp_server" {
  name_prefix = "${local.full_name}-atp-server-sg"
  vpc_id      = local.vpc_id

  # Allow inbound traffic from ALB
  ingress {
    description     = "Allow traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [module.security_groups.lb_security_group_id]
  }

  # TODO(md): confirm if this is needed
  egress {
    description = "Allow HTTPS for RPC calls"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow JSON-RPC to external node"
    from_port   = 8545
    to_port     = 8545
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # TODO: if running our own node - hardcode that allowed addr here
  }

  egress {
    description     = "TO RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.atp_db.id]
  }

  tags = merge(local.common_tags, {
    Name        = "${local.full_name}-atp-server"
    Environment = var.env
  })
}

# TODO(md): deduplicate
locals {
  indexer_env_vars = [
    # Use Aurora cluster endpoint (writer) for indexer since it performs writes
    { name = "POSTGRES_CONNECTION_STRING", value = "postgresql://${aws_rds_cluster.atp_indexer.master_username}:${local.effective_db_password}@${aws_rds_cluster.atp_indexer.endpoint}:${aws_rds_cluster.atp_indexer.port}/postgres?sslmode=no-verify" },
    { name = "RPC_URL", value = var.rpc_url },
    { name = "DATABASE_SCHEMA", value = local.database_schema },
    { name = "CHAIN_ID", value = var.chain_id },
    { name = "START_BLOCK", value = var.start_block },
    { name = "BLOCK_BATCH_SIZE", value = var.block_batch_size },
    { name = "ATP_FACTORY_ADDRESS", value = var.atp_factory_address },
    { name = "STAKING_REGISTRY_ADDRESS", value = var.staking_registry_address },
    { name = "ATP_FACTORY_AUCTION_ADDRESS", value = var.atp_factory_auction_address },
    { name = "ROLLUP_ADDRESS", value = var.rollup_address },
    { name = "POLLING_INTERVAL", value = var.polling_interval },
    { name = "MAX_RETRIES", value = var.max_retries },
    { name = "PARALLEL_BATCHES", value = var.parallel_batches },
    { name = "CLEANUP_ENABLED", value = var.cleanup_enabled },
    { name = "CLEANUP_INTERVAL_BLOCKS", value = var.cleanup_interval_blocks },
    { name = "CLEANUP_KEEP_BLOCKS", value = var.cleanup_keep_blocks },
    { name = "PONDER_LOG_LEVEL", value = "info" },
    { name = "NODE_ENV", value = "production" },
    { name = "TRUST_PROXY", value = var.trust_proxy },
    { name = "PONDER_TELEMETRY_DISABLED", value = "true" },
  ]

  server_env_vars = [
    # Use Aurora reader endpoint for server (read-only API) for automatic load balancing
    { name = "POSTGRES_CONNECTION_STRING", value = "postgresql://${aws_rds_cluster.atp_indexer.master_username}:${local.effective_db_password}@${aws_rds_cluster.atp_indexer.reader_endpoint}:${aws_rds_cluster.atp_indexer.port}/postgres?sslmode=no-verify" },
    { name = "NODE_ENV", value = "production" },
    { name = "DATABASE_SCHEMA", value = local.database_schema },
    { name = "RPC_URL", value = var.rpc_url },
    { name = "CHAIN_ID", value = var.chain_id },
    { name = "START_BLOCK", value = var.start_block },
    { name = "BLOCK_BATCH_SIZE", value = var.block_batch_size },
    { name = "ATP_FACTORY_ADDRESS", value = var.atp_factory_address },
    { name = "STAKING_REGISTRY_ADDRESS", value = var.staking_registry_address },
    { name = "ATP_FACTORY_AUCTION_ADDRESS", value = var.atp_factory_auction_address },
    { name = "ROLLUP_ADDRESS", value = var.rollup_address },
    { name = "POLLING_INTERVAL", value = var.polling_interval },
    { name = "MAX_RETRIES", value = var.max_retries },
    { name = "PARALLEL_BATCHES", value = var.parallel_batches },
    { name = "CLEANUP_ENABLED", value = var.cleanup_enabled },
    { name = "CLEANUP_INTERVAL_BLOCKS", value = var.cleanup_interval_blocks },
    { name = "CLEANUP_KEEP_BLOCKS", value = var.cleanup_keep_blocks },
    { name = "PONDER_LOG_LEVEL", value = "info" },
    { name = "PORT", value = tostring(var.container_port) },
    { name = "API_PORT", value = tostring(var.container_port) },
    { name = "TRUST_PROXY", value = var.trust_proxy }
  ]
}

resource "aws_ecs_task_definition" "atp_indexer" {
  family                   = "${local.full_name}-atp-indexer"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.indexer_cpu)
  memory                   = tostring(var.indexer_memory)
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([{
    name      = "${local.full_name}-atp-indexer"
    image     = "${aws_ecr_repository.atp_indexer.repository_url}:${var.ecr_image_tag}"
    essential = true
    portMappings = [{
      containerPort = var.container_port
      hostPort      = var.container_port
      protocol      = "tcp"
    }]

    command = ["yarn", "start"]

    environment = local.indexer_env_vars

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.atp_indexer.name
        awslogs-region        = data.aws_region.current.name
        awslogs-stream-prefix = "atp-indexer"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 300
    }
  }])
}

resource "aws_ecs_task_definition" "atp_server" {
  family                   = "${local.full_name}-atp-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.server_cpu)
  memory                   = tostring(var.server_memory)
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([{
    name  = "${local.full_name}-atp-server"
    image = "${aws_ecr_repository.atp_indexer.repository_url}:${var.ecr_image_tag}"

    command = ["yarn", "serve"]

    # TODO(md): get from the local env vars
    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = local.server_env_vars

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.atp_server.name
        awslogs-region        = data.aws_region.current.name
        awslogs-stream-prefix = "atp-server"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

# Services
resource "aws_ecs_service" "atp_indexer" {
  name            = "${local.full_name}-atp-indexer"
  cluster         = local.ecs_cluster_id
  task_definition = aws_ecs_task_definition.atp_indexer.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [local.private_subnet_1_id, local.private_subnet_2_id]
    assign_public_ip = false
    security_groups = [
      aws_security_group.atp_indexer.id,
      local.aws_services_security_group_id,
      local.vpc_internal_security_group_id
    ]
  }

  depends_on = [aws_rds_cluster.atp_indexer]

  # Deployment configuration to ensure only one task at a time
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  tags = merge(local.common_tags, {
    Name = "${local.full_name}-atp-indexer"
    Type = "ecs-service"
  })
}

resource "aws_ecs_service" "atp_server" {
  name            = "${local.full_name}-atp-server"
  cluster         = local.ecs_cluster_id
  task_definition = aws_ecs_task_definition.atp_server.arn
  desired_count   = var.desired_server_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [local.private_subnet_1_id, local.private_subnet_2_id]
    assign_public_ip = false
    security_groups = [
      aws_security_group.atp_server.id,
      local.aws_services_security_group_id,
      local.vpc_internal_security_group_id
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.atp_server.arn
    container_name   = "${local.full_name}-atp-server"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.atp,
    aws_rds_cluster.atp_indexer
  ]

  # Allow rolling deployments for server (keeps 100% healthy during updates)
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(local.common_tags, {
    Name = "${local.full_name}-atp-server"
    Type = "ecs-service"
  })
}

# Autoscaling for ATP Server
resource "aws_appautoscaling_target" "atp_server" {
  max_capacity       = var.server_autoscaling_max
  min_capacity       = var.server_autoscaling_min
  resource_id        = "service/${element(split("/", local.ecs_cluster_id), 1)}/${aws_ecs_service.atp_server.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Primary scaling metric: ALB request count (most responsive to actual traffic load)
resource "aws_appautoscaling_policy" "atp_server_requests" {
  name               = "${local.full_name}-atp-server-requests-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.atp_server.resource_id
  scalable_dimension = aws_appautoscaling_target.atp_server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.atp_server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.atp.arn_suffix}/${aws_lb_target_group.atp_server.arn_suffix}"
    }
    target_value       = var.server_autoscaling_requests_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Secondary scaling metric: CPU utilization (safety valve for resource exhaustion)
resource "aws_appautoscaling_policy" "atp_server_cpu" {
  name               = "${local.full_name}-atp-server-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.atp_server.resource_id
  scalable_dimension = aws_appautoscaling_target.atp_server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.atp_server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.server_autoscaling_cpu_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}


resource "aws_cloudfront_response_headers_policy" "cors_policy" {
  name = "${local.full_name}-atp-cors-policy"

  cors_config {
    access_control_allow_credentials = true

    access_control_allow_headers {
      items = ["Content-Type", "Authorization", "Origin", "Accept", "X-Requested-With"]
    }

    access_control_allow_methods {
      items = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"]
    }

    access_control_allow_origins {
      items = ["*"]
    }

    access_control_expose_headers {
      items = ["Content-Type", "Authorization"]
    }

    access_control_max_age_sec = 86400
    origin_override            = true
  }
}


resource "aws_cloudfront_distribution" "cf" {
  enabled             = true
  default_root_object = ""
  web_acl_id          = local.backend_waf_arn

  # Use custom domain with certificate
  # aliases = ["indexer.${var.env}.stake.aztec.network"]

  origin {
    domain_name = aws_lb.atp.dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Inject shared secret header - value is read from SSM at apply time
    # Manual changes to the SSM parameter will be picked up on next apply
    dynamic "custom_header" {
      for_each = local.cloudfront_secret_header_ssm_name != "" ? [1] : []
      content {
        name  = local.cloudfront_secret_header_name
        value = data.aws_ssm_parameter.cloudfront_secret_header[0].value
      }
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "alb-origin"

    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = "4cc15a8a-d715-48a4-82b8-cc0b614638fe"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors_policy.id
    origin_request_policy_id   = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.create_dns_record ? module.domain.certificate_arn : null
    ssl_support_method             = local.create_dns_record ? "sni-only" : null
    minimum_protocol_version       = local.create_dns_record ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = local.create_dns_record ? false : true
  }

  dynamic "logging_config" {
    for_each = try(data.terraform_remote_state.shared.outputs.cloudfront_logs_bucket_domain_name, "") != "" ? [1] : []
    content {
      bucket          = data.terraform_remote_state.shared.outputs.cloudfront_logs_bucket_domain_name
      include_cookies = false
      prefix          = "backend/atp-indexer/"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.full_name}-cf"
    Type = "cdn"
  })
}