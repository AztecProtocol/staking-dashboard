locals {
  create_dns_record = contains(["prod", "testnet", "staging"], var.env)
}
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.env
    }
  }
}

# Cloudfront certs & WAF require us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.env
    }
  }
}

locals {
  bucket_name = "${var.env}-aztec-staking-dashboard"
}


resource "aws_s3_bucket" "staking_dashboard_bucket" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  bucket = aws_s3_bucket.staking_dashboard_bucket.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket                  = aws_s3_bucket.staking_dashboard_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.staking_dashboard_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    sid     = "AllowCloudFrontOAC"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.staking_dashboard_bucket.arn}/*"
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.staking_dashboard_distribution.arn]
    }
  }

  statement {
    sid     = "AllowCloudFrontAccess"
    effect  = "Allow"
    actions = ["s3:ListBucket"]
    resources = [
      "${aws_s3_bucket.staking_dashboard_bucket.arn}"
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.staking_dashboard_distribution.arn]
    }
  }

  statement {
    sid     = "AllowAccountOwnerAccess"
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      "${aws_s3_bucket.staking_dashboard_bucket.arn}",
      "${aws_s3_bucket.staking_dashboard_bucket.arn}/*"
    ]
    principals {
      type        = "AWS"
      identifiers = [data.aws_caller_identity.current.account_id]
    }
  }
}

data "aws_caller_identity" "current" {}


resource "aws_cloudfront_origin_access_control" "oac-staking-dashboard" {
  name                              = "${var.env}-aztec-staking-dashboard-oac"
  description                       = "OAC for ${var.env} staking dashboard"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Security headers policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${var.env}-staking-dashboard-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000 # 2 years
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    content_security_policy {
      content_security_policy = "frame-ancestors 'self' https://app.safe.global"
      override                = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=()"
      override = true
    }
  }
}

# CloudFront function for basic auth
resource "aws_cloudfront_function" "basic_auth_staking_dashboard" {
  name    = "${var.env}-aztec-staking-dashboard-cf-basic-auth"
  runtime = "cloudfront-js-1.0"
  comment = "Basic Auth for internal testing"

  code = templatefile("${path.module}/basic-auth-function.js.tpl", {
    basic_auth_user = var.basic_auth_user
    basic_auth_pass = var.basic_auth_pass
  })
}

resource "aws_cloudfront_distribution" "staking_dashboard_distribution" {
  enabled             = true
  default_root_object = "index.html"
  web_acl_id          = module.website_waf.web_acl_arn

  # Custom domain (stake.aztec.network for prod, <env>.stake.aztec.network otherwise) whenever
  # the env owns a DNS record; matches module.domain so the cert and alias always agree.
  aliases = local.create_dns_record ? [var.env == "prod" ? "stake.aztec.network" : "${var.env}.stake.aztec.network"] : []

  origin {
    domain_name              = aws_s3_bucket.staking_dashboard_bucket.bucket_regional_domain_name
    origin_id                = "stakingDashboardS3Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac-staking-dashboard.id
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "stakingDashboardS3Origin"
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    compress                   = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

  }

  # Redirect to blocked.html for 403 errors
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/blocked.html"
    error_caching_min_ttl = 0
  }

  # Redirect to index.html for 404 errors
  # This is to handle the case where the user is on a route and refreshes the page
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "blacklist"
      locations        = var.blocked_jurisdictions
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.create_dns_record ? module.domain.certificate_arn : null
    ssl_support_method             = local.create_dns_record ? "sni-only" : null
    minimum_protocol_version       = local.create_dns_record ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = local.create_dns_record ? false : true
  }

  dynamic "logging_config" {
    for_each = local.cloudfront_logs_bucket != "" ? [1] : []
    content {
      bucket          = local.cloudfront_logs_bucket
      include_cookies = false
      prefix          = "frontend/staking-dashboard/"
    }
  }
}

#
# ACM Certificate + DNS (creates cert, validates, and creates A record)
#
module "domain" {
  source = "../../terraform/modules/acm-certificate"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  domain_name               = var.env == "prod" ? "stake.aztec.network" : "${var.env}.stake.aztec.network"
  subject_alternative_names = []
  hosted_zone_name          = "aztec.network"

  # DNS record will be created after CloudFront distribution
  create_dns_record      = local.create_dns_record
  cloudfront_domain_name = aws_cloudfront_distribution.staking_dashboard_distribution.domain_name
  cloudfront_zone_id     = aws_cloudfront_distribution.staking_dashboard_distribution.hosted_zone_id

  tags = {
    Environment = var.env
    Service     = "staking-dashboard"
  }
}


output "bucket_name" {
  value = aws_s3_bucket.staking_dashboard_bucket.bucket
}

output "staking_dashboard_distribution_id" {
  value = aws_cloudfront_distribution.staking_dashboard_distribution.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.staking_dashboard_distribution.domain_name
}

output "cloudfront_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.staking_dashboard_distribution.hosted_zone_id
}

