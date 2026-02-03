# Complete module for domain + certificate + DNS
# Handles: Route53 zone lookup, ACM certificate, validation, and DNS A record

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

# Lookup Route53 hosted zone
data "aws_route53_zone" "this" {
  name         = var.hosted_zone_name
  private_zone = false
}

# Create certificate in us-east-1 (required for CloudFront)
resource "aws_acm_certificate" "this" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = var.domain_name
  })
}

# Create Route53 validation records (only if create_dns_record is true)
resource "aws_route53_record" "validation" {
  for_each = var.create_dns_record ? {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.this.zone_id
}

# Wait for validation to complete (only if create_dns_record is true)
resource "aws_acm_certificate_validation" "this" {
  count = var.create_dns_record ? 1 : 0
  
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

# Create DNS A record pointing to CloudFront
resource "aws_route53_record" "this" {
  count = var.create_dns_record ? 1 : 0
  
  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }
}

