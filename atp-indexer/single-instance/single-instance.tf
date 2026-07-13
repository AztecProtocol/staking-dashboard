data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "availability-zone"
    values = [data.aws_availability_zones.available.names[0]]
  }
}

data "aws_subnet" "public" {
  id = data.aws_subnets.default.ids[0]
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-6.1-x86_64"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# In CloudFront-front mode, restrict ingress to CloudFront's origin-facing ranges
# (defense-in-depth on top of the Caddy secret-header gate). SSM is egress-based, so remote
# access still works.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  count = var.si_front_with_cloudfront ? 1 : 0
  name  = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "instance" {
  name        = "${local.si_name}-instance"
  description = "Public HTTP/HTTPS for the staking-dashboard atp-indexer single instance"
  vpc_id      = data.aws_vpc.default.id

  # CloudFront-front: lock to the CloudFront prefix list (no public CIDRs). Caddy-direct:
  # open to var.si_allowed_http_cidrs (needed for Let's Encrypt http-01 + direct access).
  ingress {
    description     = "HTTP"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    cidr_blocks     = var.si_front_with_cloudfront ? [] : var.si_allowed_http_cidrs
    prefix_list_ids = data.aws_ec2_managed_prefix_list.cloudfront[*].id
  }
  # HTTPS only in Caddy-direct mode. Behind CloudFront, Caddy serves plain HTTP on :80
  # (CloudFront terminates viewer TLS), and the CloudFront origin-facing prefix list is
  # large enough that attaching it to a second port exceeds the per-security-group rule quota.
  dynamic "ingress" {
    for_each = var.si_front_with_cloudfront ? [] : [443]
    content {
      description = "HTTPS"
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = var.si_allowed_http_cidrs
    }
  }
  egress {
    description = "Outbound internet"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.si_tags
}

resource "aws_iam_role" "instance" {
  name = "${local.si_name}-instance"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = local.si_tags
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Pull the atp-indexer image from this repo's existing ECR repository.
resource "aws_iam_role_policy" "ecr_read" {
  name = "${local.si_name}-ecr-read"
  role = aws_iam_role.instance.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/*"
      },
      {
        # Runtime env for the indexer (fetch-env.sh); the parameter is created out-of-band so
        # its values stay out of Terraform state.
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/staking-dashboard-atp/${var.env}/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "instance" {
  name = "${local.si_name}-instance"
  role = aws_iam_role.instance.name
}

resource "aws_ebs_volume" "data" {
  availability_zone = data.aws_subnet.public.availability_zone
  size              = var.si_data_volume_size_gb
  type              = "gp3"
  encrypted         = true
  # The Backup tag is what the DLM policy (single-instance-backup.tf) targets for daily
  # snapshots; keyed per environment so each box's policy only snapshots its own volume.
  tags = merge(local.si_tags, {
    Name   = "${local.si_name}-data"
    Backup = "${local.si_name}-data"
  })
}

resource "aws_instance" "this" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.si_instance_type
  subnet_id                   = data.aws_subnet.public.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.instance.id]
  iam_instance_profile        = aws_iam_instance_profile.instance.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    env               = var.env
    region            = var.region
    account_id        = data.aws_caller_identity.current.account_id
    volume_id_no_dash = replace(aws_ebs_volume.data.id, "-", "")
    compose_b64 = base64encode(templatefile("${path.module}/templates/docker-compose.yml.tftpl", {
      atp_indexer_image              = var.si_atp_indexer_image
      atp_postgres_connection_string = "postgresql://ponder:ponder@local-postgres:5432/ponder"
      atp_database_schema            = var.si_atp_database_schema
    }))
    caddyfile_b64 = base64encode(templatefile("${path.module}/templates/Caddyfile.tftpl", {
      acme_email             = var.si_acme_email
      atp_indexer_domain     = var.si_atp_indexer_domain
      cloudfront_front       = var.si_front_with_cloudfront
      cf_secret_header_name  = var.cloudfront_secret_header_name
      cf_secret_header_value = local.cf_secret_value
    }))
    start_services_on_boot = var.si_start_services_on_boot
  })

  lifecycle {
    precondition {
      condition     = !(var.si_create_dns_records && var.si_front_with_cloudfront)
      error_message = "si_create_dns_records and si_front_with_cloudfront are mutually exclusive (both would own the same A-record). Use Caddy-direct OR CloudFront-front, not both."
    }
    precondition {
      condition     = !var.si_front_with_cloudfront || local.cf_secret_value != ""
      error_message = "The CloudFront secret header resolved empty in CloudFront mode. Either the shared SSM secret (cloudfront_secret_header_ssm_name in the ignition-infrastructure state) isn't populated, or set cloudfront_secret_header_value. Caddy enforces the header, so empty would reject every request."
    }
    precondition {
      condition     = !var.si_front_with_cloudfront || local.cf_waf_arn_resolved != null
      error_message = "The CLOUDFRONT-scoped WAF resolved null in CloudFront mode. Ensure the shared ignition-infrastructure state (key ${local.si_env_parent}/backends/ignition-infrastructure/terraform.tfstate) exposes backend_waf_arn, or set si_cf_web_acl_arn. Refusing to front the box without a WAF."
    }
  }

  tags = local.si_tags
}

resource "aws_volume_attachment" "data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.this.id
}

resource "aws_eip" "this" {
  domain   = "vpc"
  instance = aws_instance.this.id
  tags     = local.si_tags
}

data "aws_route53_zone" "zone" {
  count        = var.si_create_dns_records || var.si_front_with_cloudfront ? 1 : 0
  name         = var.si_route53_zone_name
  private_zone = false
}

# Caddy-direct: hostname -> the instance EIP (testnet). Mutually exclusive with CloudFront-front.
resource "aws_route53_record" "direct" {
  count   = var.si_create_dns_records ? 1 : 0
  zone_id = data.aws_route53_zone.zone[0].zone_id
  name    = var.si_atp_indexer_domain
  type    = "A"
  ttl     = 60
  records = [aws_eip.this.public_ip]
}

output "instance_public_ip" {
  value = aws_eip.this.public_ip
}

output "instance_id" {
  value = aws_instance.this.id
}
