output "web_acl_id" {
  description = "The ID of the WAF WebACL"
  value       = aws_wafv2_web_acl.this.id
}

output "web_acl_arn" {
  description = "The ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.this.arn
}

output "web_acl_name" {
  description = "The name of the WAF WebACL"
  value       = aws_wafv2_web_acl.this.name
}

output "web_acl_capacity" {
  description = "The capacity used by the WAF WebACL"
  value       = aws_wafv2_web_acl.this.capacity
}