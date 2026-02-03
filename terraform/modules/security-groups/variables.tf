variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}
