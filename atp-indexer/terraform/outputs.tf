output "alb_dns_name" {
  description = "ATP ALB DNS name"
  value       = aws_lb.atp.dns_name
}

output "ecr_repository_url" {
  description = "ATP indexer ECR repository URL"
  value       = aws_ecr_repository.atp_indexer.repository_url
}

output "ecs_service_arn" {
  description = "ECS ATP server service ARN"
  value       = aws_ecs_service.atp_server.id
}

output "ecs_service_indexer_arn" {
  description = "ECS indexer service ARN"
  value       = aws_ecs_service.atp_indexer.id
}

output "cloudfront_distribution_id" {
  description = "ATP CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cf.id
}

output "rds_backup_retention_period" {
  description = "Aurora backup retention period in days"
  value       = aws_rds_cluster.atp_indexer.backup_retention_period
}

output "rds_backup_window" {
  description = "Aurora backup window"
  value       = aws_rds_cluster.atp_indexer.preferred_backup_window
}

output "rds_maintenance_window" {
  description = "Aurora maintenance window"
  value       = aws_rds_cluster.atp_indexer.preferred_maintenance_window
}

output "db_cluster_endpoint" {
  description = "Aurora cluster endpoint (writer endpoint for writes)"
  value       = aws_rds_cluster.atp_indexer.endpoint
}

output "db_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint (automatically load balances reads across replicas)"
  value       = aws_rds_cluster.atp_indexer.reader_endpoint
}

output "db_address" {
  description = "Aurora primary database endpoint address (for writes) - alias for db_cluster_endpoint"
  value       = aws_rds_cluster.atp_indexer.endpoint
}

output "db_port" {
  description = "Aurora database port"
  value       = aws_rds_cluster.atp_indexer.port
}

output "db_replica_endpoints" {
  description = "Individual Aurora instance endpoints (use cluster reader endpoint for automatic load balancing)"
  value       = [for instance in aws_rds_cluster_instance.instances : instance.endpoint]
}

output "cf_domain_name" {
  description = "ATP CloudFront domain name"
  value       = aws_cloudfront_distribution.cf.domain_name
}

output "db_username" {
  description = "Aurora database username"
  value       = aws_rds_cluster.atp_indexer.master_username
}

output "db_password_ssm_name" {
  description = "SSM parameter name containing the database password"
  value       = aws_ssm_parameter.db_password.name
}

output "db_security_group_id" {
  description = "Security group ID for RDS database"
  value       = aws_security_group.atp_db.id
}

output "indexer_service_name" {
  description = "ATP indexer ECS service name"
  value       = aws_ecs_service.atp_indexer.name
}

output "server_service_name" {
  description = "ATP server ECS service name"
  value       = aws_ecs_service.atp_server.name
}

output "log_groups" {
  description = "CloudWatch log groups"
  value = {
    indexer = aws_cloudwatch_log_group.atp_indexer.name
    server  = aws_cloudwatch_log_group.atp_server.name
  }
}