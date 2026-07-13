variable "env" {
  description = "Environment name (e.g. testnet, prod)"
  type        = string
  default     = "testnet"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "env_parent" {
  description = "Parent env for the shared ignition-infrastructure Terraform state (CloudFront secret + WAF). Defaults to env."
  type        = string
  default     = ""
}

variable "si_instance_type" {
  description = "EC2 instance size"
  type        = string
  default     = "t3.large"
}

variable "si_data_volume_size_gb" {
  description = "Persistent /data EBS volume size (GB)"
  type        = number
  default     = 50
}

variable "si_allowed_http_cidrs" {
  description = "CIDRs allowed to reach the instance on 80/443"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "si_atp_indexer_image" {
  description = "ATP indexer image (this repo's image) for the single instance"
  type        = string
  default     = ""
}

variable "si_atp_database_schema" {
  description = "Postgres schema the atp-indexer uses"
  type        = string
  default     = "atp_indexer"
}

variable "si_atp_indexer_domain" {
  description = "Public hostname for the ATP indexer API. Convention: api.<env>.stake.aztec.network, and api.stake.aztec.network for prod — one stable branded endpoint (instead of a raw *.cloudfront.net URL) so the frontend never changes when the infra behind it does."
  type        = string
  default     = "api.testnet.stake.aztec.network"
}

variable "si_acme_email" {
  description = "Email for Caddy ACME registration (Caddy-direct mode)"
  type        = string
  default     = "ops@aztec.foundation"
}

variable "si_start_services_on_boot" {
  description = "Start Docker Compose from user data (keep false until the env file is populated)"
  type        = bool
  default     = false
}

variable "si_create_dns_records" {
  description = "Create a Route53 A record for the indexer hostname -> the instance EIP (Caddy-direct). Mutually exclusive with si_front_with_cloudfront."
  type        = bool
  default     = false
}

# --- Prod CloudFront-front (mirrors ignition's single-instance-cloudfront.tf) ---

variable "si_front_with_cloudfront" {
  description = "Prod: put CloudFront (CDN/WAF/DDoS/ACM) in front of the box instead of Caddy-direct"
  type        = bool
  default     = false
}

variable "si_cf_web_acl_arn" {
  description = "Override the CLOUDFRONT-scoped WAFv2 WebACL ARN. Default null = use the shared backend WAF from remote state (what the existing atp-indexer CloudFront uses)."
  type        = string
  default     = null
}

variable "cloudfront_secret_header_name" {
  description = "Name of the secret header CloudFront injects and Caddy enforces"
  type        = string
  default     = "X-CloudFront-Secret"
}

variable "cloudfront_secret_header_value" {
  description = "Override the CloudFront secret header value. Default empty = read the shared value from SSM (what the existing fleet uses). In CloudFront mode the resolved value must be non-empty (enforced by a precondition), since Caddy enforces the header."
  type        = string
  sensitive   = true
  default     = ""
}

variable "si_route53_zone_name" {
  description = "Route53 hosted zone for the indexer hostname"
  type        = string
  default     = "aztec.network."
}
