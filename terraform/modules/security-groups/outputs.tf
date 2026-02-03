output "lb_security_group_id" {
  description = "Load balancer security group ID"
  value       = aws_security_group.lb.id
}

output "service_security_group_id" {
  description = "Service security group ID"
  value       = aws_security_group.service.id
}
