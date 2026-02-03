variable "name" {
  description = "Name prefix for WAF resources"
  type        = string
}

variable "scope" {
  description = "Scope of the WAF (CLOUDFRONT or REGIONAL)"
  type        = string
  default     = "CLOUDFRONT"
  
  validation {
    condition     = contains(["CLOUDFRONT", "REGIONAL"], var.scope)
    error_message = "Scope must be either CLOUDFRONT or REGIONAL"
  }
}

variable "rate_limit" {
  description = "Rate limit per IP per 5 minutes"
  type        = number
  default     = 2000
}

variable "enable_size_restriction_rule" {
  description = "Enable size restriction rule"
  type        = bool
  default     = false
}

variable "max_request_size_kb" {
  description = "Maximum request body size in KB"
  type        = number
  default     = 8
}

variable "enable_managed_core_rule_set" {
  description = "Enable AWS Managed Core Rule Set"
  type        = bool
  default     = true
}

variable "enable_known_bad_inputs_rule_set" {
  description = "Enable AWS Managed Known Bad Inputs Rule Set"
  type        = bool
  default     = true
}

variable "enable_sql_injection_rule_set" {
  description = "Enable AWS Managed SQL Injection Rule Set"
  type        = bool
  default     = true
}


variable "enable_xss_rule_set" {
  description = "Enable AWS Managed XSS Rule Set"
  type        = bool
  default     = true
}

variable "enable_bot_control_rule_set" {
  description = "Enable AWS Managed Bot Control Rule Set"
  type        = bool
  default     = true
}

variable "enable_anon_ip_rule_set" {
  description = "Enable AWS Managed Anonymous IP Rule Set"
  type        = bool
  default     = true
}

variable "enable_ip_reputation_list" {
  description = "Enable AWS Managed IP Reputation List"
  type        = bool
  default     = true
}

variable "allowed_methods" {
  description = "List of allowed HTTP methods"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]
}

variable "custom_response_bodies" {
  description = "Custom response bodies for blocked requests"
  type = map(object({
    content_type = string
    content      = string
  }))
  default = {
    rate_limit_exceeded = {
      content_type = "APPLICATION_JSON"
      content      = "{\"error\": \"Rate limit exceeded. Please try again later.\"}"
    }
    blocked_request = {
      content_type = "APPLICATION_JSON"
      content      = "{\"error\": \"Your request has been blocked.\"}"
    }
  }
}

variable "tags" {
  description = "Tags to apply to WAF resources"
  type        = map(string)
  default     = {}
}

variable "cloudwatch_metrics_enabled" {
  description = "Enable CloudWatch metrics for all rules"
  type        = bool
  default     = true
}

variable "sampled_requests_enabled" {
  description = "Enable sampled requests for all rules"
  type        = bool
  default     = true
}

variable "blocked_countries" {
  description = "List of country codes to block (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = []
}

variable "enable_geo_blocking" {
  description = "Enable geographic blocking in WAF"
  type        = bool
  default     = false
}

variable "enable_enhanced_vpn_detection" {
  description = "Enable enhanced VPN/proxy detection rules"
  type        = bool
  default     = false
}

variable "vpn_detection_action" {
  description = "Action to take for detected VPN traffic (block or count)"
  type        = string
  default     = "block"
  validation {
    condition     = contains(["block", "count"], var.vpn_detection_action)
    error_message = "VPN detection action must be either 'block' or 'count'"
  }
}

variable "custom_vpn_ip_list" {
  description = "Custom list of known VPN/proxy IP ranges to block"
  type        = list(string)
  default     = []
}

variable "blocked_ukrainian_regions" {
  description = "List of Ukrainian region codes to block (ISO 3166-2 region code without country prefix, e.g., \"14\" for Donetsk, \"09\" for Luhansk, \"43\" for Crimea). Full list: https://en.wikipedia.org/wiki/ISO_3166-2:UA"
  type        = list(string)
  default     = []
}