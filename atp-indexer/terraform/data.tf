data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "aztec-token-sale-terraform-state"
    key    = "${var.env_parent}/backends/ignition-infrastructure/terraform.tfstate"
    region = "eu-west-2"
  }
}

locals {
  vpc_id                         = data.terraform_remote_state.shared.outputs.vpc_id
  vpc_cidr                       = data.terraform_remote_state.shared.outputs.vpc_cidr
  public_subnet_1_id             = data.terraform_remote_state.shared.outputs.public_subnet_1_id
  public_subnet_2_id             = data.terraform_remote_state.shared.outputs.public_subnet_2_id
  private_subnet_1_id            = data.terraform_remote_state.shared.outputs.private_subnet_1_id
  private_subnet_2_id            = data.terraform_remote_state.shared.outputs.private_subnet_2_id
  private_subnet_3_id            = data.terraform_remote_state.shared.outputs.private_subnet_3_id
  ecs_cluster_id                 = data.terraform_remote_state.shared.outputs.ecs_cluster_id
  aws_services_security_group_id = data.terraform_remote_state.shared.outputs.aws_services_security_group_id
  vpc_internal_security_group_id = data.terraform_remote_state.shared.outputs.vpc_internal_security_group_id
  backend_waf_arn                = data.terraform_remote_state.shared.outputs.backend_waf_arn

  # CloudFront secret header configuration (shared across all backend services)
  # Use try() to handle cases where outputs don't exist yet in remote state
  cloudfront_secret_header_ssm_name = try(data.terraform_remote_state.shared.outputs.cloudfront_secret_header_ssm_name, "")
  cloudfront_secret_header_name     = try(data.terraform_remote_state.shared.outputs.cloudfront_secret_header_name, "X-CloudFront-Secret")
}

# Read the CloudFront secret header value from SSM (if it exists)
# This data source always reads the CURRENT value from AWS, so manual changes
# to the SSM parameter will be automatically picked up on the next terraform apply
data "aws_ssm_parameter" "cloudfront_secret_header" {
  count = local.cloudfront_secret_header_ssm_name != "" ? 1 : 0
  name  = local.cloudfront_secret_header_ssm_name
}