# Shared security group module for common patterns across services

# Get AWS managed prefix list for CloudFront
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# Load Balancer Security Group
resource "aws_security_group" "lb" {
  name        = "${var.name_prefix}-lb-sg"
  description = "ALB security group"
  vpc_id      = var.vpc_id

  egress {
    description = "To ECS service on application port"
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-lb-sg"
    Type = "security"
  })
}

# Use separate security group rule for CloudFront to avoid hitting rule limits
resource "aws_security_group_rule" "lb_cloudfront_ingress" {
  type              = "ingress"
  description       = "HTTP from CloudFront"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  prefix_list_ids   = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  security_group_id = aws_security_group.lb.id
}

# Service Security Group
resource "aws_security_group" "service" {
  name        = "${var.name_prefix}-svc-sg"
  description = "ECS service security group"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.lb.id]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-svc-sg"
    Type = "security"
  })
}
