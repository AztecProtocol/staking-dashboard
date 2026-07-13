# Reuse the SAME shared CloudFront secret + WAF the existing atp-indexer fleet uses, so a
# prod CloudFront-front deploy needs no manual secret/WAF inputs (and matches the current
# security posture exactly). Mirrors atp-indexer/terraform/data.tf. The si_cf_web_acl_arn /
# cloudfront_secret_header_value vars override these if you ever need to.

data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "aztec-token-sale-terraform-state"
    key    = "${local.si_env_parent}/backends/ignition-infrastructure/terraform.tfstate"
    region = "eu-west-2"
  }
}

locals {
  si_env_parent = var.env_parent != "" ? var.env_parent : var.env

  # SSM name of the shared CloudFront secret value (read its current value below).
  cf_secret_ssm_name = try(data.terraform_remote_state.shared.outputs.cloudfront_secret_header_ssm_name, "")

  # CLOUDFRONT-scoped WAF — explicit var wins, else the shared backend WAF (same one the
  # existing atp-indexer CloudFront attaches).
  cf_waf_arn_resolved = var.si_cf_web_acl_arn != null ? var.si_cf_web_acl_arn : try(data.terraform_remote_state.shared.outputs.backend_waf_arn, null)
}

data "aws_ssm_parameter" "cf_secret" {
  count = local.cf_secret_ssm_name != "" ? 1 : 0
  name  = local.cf_secret_ssm_name
}

locals {
  # Secret value: explicit var wins, else the shared SSM value. Used only in CloudFront mode.
  cf_secret_value = var.cloudfront_secret_header_value != "" ? var.cloudfront_secret_header_value : try(data.aws_ssm_parameter.cf_secret[0].value, "")
}
