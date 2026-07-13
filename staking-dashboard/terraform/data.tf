locals {
  # Prod and testnet were migrated from the ECS/Aurora indexer stacks to stable,
  # branded single-instance endpoints. Keep frontend deploys independent from
  # the retired indexer Terraform states so deleting an old blue/green stack
  # cannot break a dashboard release.
  single_instance_atp_indexer_urls = {
    prod    = "https://api.stake.aztec.network"
    testnet = "https://api.testnet.stake.aztec.network"
  }

  uses_single_instance_atp_indexer = contains(keys(local.single_instance_atp_indexer_urls), var.env)
}

data "terraform_remote_state" "atp-indexer" {
  count = local.uses_single_instance_atp_indexer ? 0 : 1

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
    key    = "${var.env_parent}/backends/ignition-infrastructure/terraform.tfstate"
    region = "eu-west-2"
  }
}

# Local references to backend service URLs
locals {
  atp_indexer_url = local.uses_single_instance_atp_indexer ? (
    local.single_instance_atp_indexer_urls[var.env]
    ) : (
    "https://${data.terraform_remote_state.atp-indexer[0].outputs.cf_domain_name}"
  )
  cloudfront_logs_bucket = try(data.terraform_remote_state.shared.outputs.cloudfront_logs_bucket_domain_name, "")
}

output "atp_indexer_url" {
  value = local.atp_indexer_url
}
