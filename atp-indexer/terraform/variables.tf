variable "app_name" {
  description = "Application name"
  type        = string
  default     = "atp-indexer"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 42068
}

variable "trust_proxy" {
  description = "Trust proxy"
  type        = string
  default     = "2"
}

variable "chain_id" {
  description = "Chain id"
  type        = string
  default     = "11155111"
}

variable "ecr_image_tag" {
  description = "ECR image tag"
  type        = string
  default     = "latest"
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "env_parent" {
  description = "Parent environment for shared infrastructure"
  type        = string
  default     = "dev"
}

variable "desired_server_count" {
  description = "Desired number of server instances"
  type        = number
  default     = 3
}

variable "server_autoscaling_min" {
  description = "Minimum number of server instances for autoscaling"
  type        = number
  default     = 2
}

variable "server_autoscaling_max" {
  description = "Maximum number of server instances for autoscaling"
  type        = number
  default     = 20
}

variable "server_autoscaling_cpu_target" {
  description = "Target CPU utilization percentage for autoscaling"
  type        = number
  default     = 70
}

variable "server_autoscaling_requests_target" {
  description = "Target ALB requests per target per minute for autoscaling (conservative, since we also scale on CPU)"
  type        = number
  # Target: 2000 requests per target per minute ~ 33 per second
  # This is conservative since we also scale on CPU - allows high throughput per instance
  # before triggering scale-out, reducing costs while maintaining responsiveness
  default     = 2000
}

variable "indexer_cpu" {
  description = "CPU units for indexer task"
  type        = number
  default     = 4096
}

variable "indexer_memory" {
  description = "Memory units for indexer task"
  type        = number
  default     = 8192 # 8 GB
}

variable "server_cpu" {
  description = "CPU units for server task"
  type        = number
  default     = 4096
}

variable "server_memory" {
  description = "Memory units for server task"
  type        = number
  default     = 8192 # 8 GB
}


variable "cloudfront_cname" {
  description = "CloudFront CNAME"
  type        = string
  default     = ""
}

variable "cloudfront_certificate_arn" {
  description = "CloudFront certificate ARN"
  type        = string
  default     = ""
}

variable "atp_factory_address" {
  description = "ATP Factory contract address"
  type        = string
}

variable "atp_factory_auction_address" {
    description = "ATP Factory Auction contract address"
    type        = string
    default     = ""
}

variable "staking_registry_address" {
  description = "Staking Registry contract address"
  type        = string
}

variable "rollup_address" {
  description = "Rollup contract address"
  type        = string
}

variable "start_block" {
  description = "Block number to start indexing from"
  type        = string
}

variable "block_batch_size" {
  description = "Number of blocks to process in each batch"
  type        = string
  default     = "1000"
}

variable "polling_interval" {
  description = "Polling interval in milliseconds"
  type        = string
  default     = "5000"
}

variable "max_retries" {
  description = "Maximum number of retries"
  type        = string
  default     = "3"
}

variable "parallel_batches" {
  description = "Number of parallel batches"
  type        = string
  default     = "1"
}

variable "cleanup_enabled" {
  description = "Cleanup enabled"
  type        = string
  default     = "true"
}

variable "cleanup_interval_blocks" {
  description = "Cleanup interval blocks"
  type        = string
  default     = "1000"
}

variable "cleanup_keep_blocks" {
  description = "Cleanup keep blocks"
  type        = string
  default     = "5000"
}

variable "log_level" {
  description = "Log level"
  type        = string
  default     = "info"
}

variable "rpc_url" {
  description = "RPC URL"
  type        = string
}

variable "logs_retention_in_days" {
  description = "CloudWatch logs retention in days"
  type        = number
  default     = 14
}

variable "db_username" {
  description = "Postgres username"
  type        = string
  default     = "atpindexer"
}

variable "db_password_ssm_name" {
  description = "SSM parameter name for DB password"
  type        = string
  default     = "/atp-indexer/db_password"
}

variable "db_password" {
  description = "DB password (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""

  validation {
    condition     = var.db_password == "" || length(var.db_password) >= 12
    error_message = "db_password must be at least 12 characters if provided."
  }
}

variable "db_instance_class" {
  description = "Aurora instance class (defaults to prod-safe db.r7g.2xlarge, downsized in non-prod)"
  type        = string
  default     = "db.r7g.2xlarge"
}

# Note: Aurora automatically manages storage - it grows automatically from 10GB to 128TB
# No need for allocated_storage, iops, or storage_throughput variables

variable "db_read_replica_count" {
  description = "Number of read replicas (0-3). Defaults to 2 for prod HA, reduced in non-prod"
  type        = number
  default     = 2

  validation {
    condition     = var.db_read_replica_count >= 0 && var.db_read_replica_count <= 3
    error_message = "Read replica count must be between 0 and 3."
  }
}

variable "db_backup_retention_days" {
  description = "Number of days to retain RDS backups"
  type        = number
  default     = 7

  validation {
    condition     = var.db_backup_retention_days >= 0 && var.db_backup_retention_days <= 35
    error_message = "Backup retention must be between 0 and 35 days."
  }
}

variable "db_backup_window" {
  description = "RDS backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "RDS maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "deployment_suffix" {
  description = "Deployment suffix"
  type        = string
  default     = ""
}