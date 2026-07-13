# Single-instance stack for the staking-dashboard atp-indexer.
#
# Collapses the atp-indexer's per-env ECS + Aurora + ALB onto ONE EC2 box running the
# atp-indexer (this repo's own image — it indexes ATP_FACTORY_MATP etc. that ignition's
# does not, so the two are NOT interchangeable) against a LOCAL Postgres, fronted by Caddy
# (Caddy-direct TLS for testnet, or CloudFront-front for prod). Mirrors the ignition
# single-instance pattern (intentional duplication — the repos are decoupled).
#
# This is an ADDITIVE stack with its own state. Standing it up does not touch the existing
# atp-indexer/terraform stack; cutover (repoint the frontend's indexer URL to this box's
# CloudFront, then tear down the old ECS/Aurora/ALB) is a separate, explicit step. See README.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial config — `key` is supplied at `terraform init` (see README), e.g.
  #   <env>/staking-dashboard/atp-indexer-single-instance/terraform.tfstate
  backend "s3" {
    bucket  = "aztec-token-sale-terraform-state"
    region  = "eu-west-2"
    encrypt = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Environment = var.env }
  }
}

# CloudFront + CLOUDFRONT-scoped WAF/ACM require us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = { Environment = var.env }
  }
}

locals {
  si_name = "staking-dashboard-atp-single-instance-${var.env}"
  si_tags = {
    Name        = local.si_name
    Environment = var.env
    CostPlan    = "single-instance"
  }
}
