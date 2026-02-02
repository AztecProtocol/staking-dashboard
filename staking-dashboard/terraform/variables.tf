variable "env" {
  description = "Environment name (e.g., dev, sepolia, mainnet)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "basic_auth_user" {
  description = "Basic Auth username"
  type        = string
  sensitive   = true
}

variable "basic_auth_pass" {
  description = "Basic Auth password"
  type        = string
  sensitive   = true
}

variable "cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "indexer_deployment_suffix" {
  description = "Deployment suffix for the indexer, '-green' for green deployment and '' for red deployment"
  type        = string
  default     = ""
}

variable "blocked_jurisdictions" {
  description = "List of country codes to block from accessing the site"
  type        = list(string)
  default = [
    "IR", # Iran
    "KP", # North Korea
    "CU", # Cuba
    "MM", # Myanmar
  ]

}
