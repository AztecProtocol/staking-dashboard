# WAF for staking dashboard website
module "website_waf" {
  source = "../../terraform/modules/waf"
  
  providers = {
    aws = aws.us_east_1
  }

  name  = "${var.env}-staking-dashboard-waf"
  scope = "CLOUDFRONT"

  # Higher rate limits for static website
  rate_limit          = 5000  # 5000 requests per 5 minutes per IP
  max_request_size_kb = 2     # 2KB max request size for static site

  # Managed rule sets for website protection
  enable_managed_core_rule_set      = true
  enable_known_bad_inputs_rule_set  = true
  enable_sql_injection_rule_set     = false  # Not needed for static site
  enable_ip_reputation_list         = true
  enable_anon_ip_rule_set           = false
  enable_bot_control_rule_set       = true
  enable_xss_rule_set               = true

  # Block specific Ukrainian regions
  # Region codes: 14=Donetsk, 09=Luhansk, 23=Zaporizhzhia, 65=Kherson, 43=Crimea, 40=Sevastopol
  blocked_ukrainian_regions = ["14", "09", "23", "65", "43", "40"]

  # Static websites only need these methods
  allowed_methods = ["GET", "HEAD", "OPTIONS"]

  # Enable geo-blocking with comprehensive jurisdiction list
  enable_geo_blocking = true
  blocked_countries   = var.blocked_jurisdictions

  # Custom response bodies
  custom_response_bodies = {
    rate_limit_exceeded = {
      content_type = "TEXT_HTML"
      content      = <<-EOT
        <!DOCTYPE html>
        <html>
        <head><title>Rate Limit Exceeded</title></head>
        <body>
          <h1>Rate Limit Exceeded</h1>
          <p>You have made too many requests. Please try again later.</p>
        </body>
        </html>
      EOT
    }
    blocked_request = {
      content_type = "TEXT_HTML"
      content      = <<-EOT
        <!DOCTYPE html>
        <html>
        <head><title>Access Denied</title></head>
        <body>
          <h1>Access Denied</h1>
          <p>Your request has been blocked.</p>
        </body>
        </html>
      EOT
    }
  }

  tags = {
    Environment = var.env
    Project     = "ignition-staking-dashboard"
    ManagedBy   = "terraform"
    Type        = "security"
  }
}