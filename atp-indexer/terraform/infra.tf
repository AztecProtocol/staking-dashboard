terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "aztec-token-sale-terraform-state"
    region  = "eu-west-2"
    encrypt = true
  }
}


provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.env
    }
  }
}

# Provider for us-east-1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.env
    }
  }
}

locals {
  full_name = "${var.app_name}-${var.env}${var.deployment_suffix}"

  # Read database schemas from central configuration file
  db_schemas      = jsondecode(file("${path.module}/../../db-schemas.json"))
  database_schema = local.db_schemas["atp-indexer"][var.env]

  common_tags = {
    Environment = var.env
    Project     = "ignition-backend"
    Service     = "atp-indexer"
    ManagedBy   = "terraform"
  }
}


data "aws_region" "current" {}

data "aws_caller_identity" "current" {}