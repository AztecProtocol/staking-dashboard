output "certificate_arn" {
  description = "ARN of the certificate (validated if DNS records created, otherwise unvalidated)"
  value       = var.create_dns_record ? aws_acm_certificate_validation.this[0].certificate_arn : aws_acm_certificate.this.arn
}

output "certificate_domain" {
  description = "Domain name of the certificate"
  value       = aws_acm_certificate.this.domain_name
}

output "certificate_status" {
  description = "Status of the certificate"
  value       = aws_acm_certificate.this.status
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.this.zone_id
}

output "route53_zone_name" {
  description = "Route53 hosted zone name"
  value       = data.aws_route53_zone.this.name
}

output "dns_record_fqdn" {
  description = "FQDN of the DNS record (if created)"
  value       = var.create_dns_record ? aws_route53_record.this[0].fqdn : null
}

