# Prod CloudFront-front for the box (gated on si_front_with_cloudfront). One distribution
# fronting the indexer hostname: ACM (us-east-1), http-only origin via a stable si-origin
# A-record -> EIP, the secret header injected (Caddy enforces it). Mirrors ignition's
# single-instance-cloudfront.tf. NOT applied by default. See README for cutover.

locals {
  si_cf_enabled     = var.si_front_with_cloudfront ? 1 : 0
  si_cf_origin_id   = "atp-single-instance-origin"
  si_cf_origin_fqdn = "atp-si-origin.${var.env}.stake.aztec.network"
}

resource "aws_route53_record" "cf_origin" {
  count   = local.si_cf_enabled
  zone_id = data.aws_route53_zone.zone[0].zone_id
  name    = local.si_cf_origin_fqdn
  type    = "A"
  ttl     = 60
  records = [aws_eip.this.public_ip]
}

resource "aws_acm_certificate" "cf" {
  count             = local.si_cf_enabled
  provider          = aws.us_east_1
  domain_name       = var.si_atp_indexer_domain
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
  tags = local.si_tags
}

resource "aws_route53_record" "cf_cert_validation" {
  for_each = local.si_cf_enabled == 1 ? {
    for o in aws_acm_certificate.cf[0].domain_validation_options : o.domain_name => {
      name = o.resource_record_name, type = o.resource_record_type, record = o.resource_record_value
    }
  } : {}
  zone_id         = data.aws_route53_zone.zone[0].zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cf" {
  count                   = local.si_cf_enabled
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cf[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cf_cert_validation : r.fqdn]
}

resource "aws_cloudfront_distribution" "front" {
  count      = local.si_cf_enabled
  enabled    = true
  aliases    = [var.si_atp_indexer_domain]
  web_acl_id = local.cf_waf_arn_resolved
  comment    = "staking-dashboard atp single-instance front (${var.env})"

  origin {
    domain_name = local.si_cf_origin_fqdn
    origin_id   = local.si_cf_origin_id
    custom_origin_config {
      # http-only matches the old ALB origins and avoids the LE-cert-on-box problem (the
      # hostname resolves to CloudFront). The secret header gates the origin.
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    dynamic "custom_header" {
      for_each = local.cf_secret_value != "" ? [1] : []
      content {
        name  = var.cloudfront_secret_header_name
        value = local.cf_secret_value
      }
    }
  }

  default_cache_behavior {
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = local.si_cf_origin_id
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # Managed-AllViewer
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cf[0].certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(local.si_tags, { Type = "cdn" })
}

resource "aws_route53_record" "cf_alias" {
  count   = local.si_cf_enabled
  zone_id = data.aws_route53_zone.zone[0].zone_id
  name    = var.si_atp_indexer_domain
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.front[0].domain_name
    zone_id                = aws_cloudfront_distribution.front[0].hosted_zone_id
    evaluate_target_health = false
  }
}

output "cloudfront_domain_name" {
  description = "CloudFront domain for the box (point the frontend's indexer URL here at cutover)"
  value       = one(aws_cloudfront_distribution.front[*].domain_name)
}

# The staking-dashboard frontend reads `cf_domain_name` from the atp-indexer remote state
# (staking-dashboard/terraform/data.tf) to build the indexer URL. Expose the same name in
# BOTH modes so the frontend can be repointed at this stack's state with no output rename:
# - CloudFront-front (prod): the CloudFront distribution domain.
# - Caddy-direct (testnet): the indexer hostname (resolves to the EIP, Caddy serves TLS).
output "cf_domain_name" {
  description = "Indexer endpoint host for the frontend (CloudFront domain in CF mode; the indexer hostname otherwise)"
  value       = var.si_front_with_cloudfront ? one(aws_cloudfront_distribution.front[*].domain_name) : var.si_atp_indexer_domain
}
