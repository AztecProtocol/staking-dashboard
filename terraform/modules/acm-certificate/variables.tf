variable "domain_name" {
  description = "Primary domain name for the certificate and DNS record"
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional domain names to include in certificate"
  type        = list(string)
  default     = []
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name (e.g., 'aztec.network')"
  type        = string
  default     = "aztec.network"
}

variable "create_dns_record" {
  description = "Whether to create the Route53 A record"
  type        = bool
  default     = true
}

variable "cloudfront_domain_name" {
  description = "CloudFront distribution domain name for DNS A record"
  type        = string
  default     = ""
}

variable "cloudfront_zone_id" {
  description = "CloudFront distribution hosted zone ID for DNS A record"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to certificate"
  type        = map(string)
  default     = {}
}

