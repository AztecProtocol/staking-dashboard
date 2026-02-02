data "terraform_remote_state" "atp-indexer" {
  backend = "s3"
  config = {
    bucket = "aztec-token-sale-terraform-state"
    key    = "${var.env}${var.indexer_deployment_suffix}/backends/atp-indexer/terraform.tfstate"
    region = "eu-west-2"
  }
}

# Reference the shared backend infrastructure state for CloudFront logs bucket
data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "aztec-token-sale-terraform-state"
    key    = "${var.env}/backends/ignition-infrastructure/terraform.tfstate"
    region = "eu-west-2"
  }
}

# Local references to backend service URLs
locals {
  atp_indexer_url         = "https://${data.terraform_remote_state.atp-indexer.outputs.cf_domain_name}"
  cloudfront_logs_bucket  = try(data.terraform_remote_state.shared.outputs.cloudfront_logs_bucket_domain_name, "")
}

output "atp_indexer_url" {
  value = local.atp_indexer_url
}

