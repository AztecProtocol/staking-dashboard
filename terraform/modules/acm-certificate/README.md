# ACM Certificate + DNS Module

Complete module that handles:
- Route53 hosted zone lookup
- ACM certificate creation (in us-east-1 for CloudFront)
- Automatic DNS validation
- Route53 A record creation pointing to CloudFront

## Usage

```hcl
# Provider configuration (us-east-1 required for CloudFront certs)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Create certificate and DNS
module "domain" {
  source = "../../terraform/modules/acm-certificate"
  
  providers = {
    aws.us_east_1 = aws.us_east_1
  }
  
  domain_name               = "api.dev.sale.aztec.network"
  subject_alternative_names = []  # Optional additional domains
  hosted_zone_name          = "aztec.network"
  
  # CloudFront details for DNS A record
  create_dns_record      = true
  cloudfront_domain_name = aws_cloudfront_distribution.main.domain_name
  cloudfront_zone_id     = aws_cloudfront_distribution.main.hosted_zone_id
  
  tags = {
    Environment = "dev"
    Service     = "api"
  }
}

# Use the certificate in CloudFront
resource "aws_cloudfront_distribution" "main" {
  aliases = [module.domain.certificate_domain]
  
  viewer_certificate {
    acm_certificate_arn      = module.domain.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  # ... other config
}
```

## What It Does

1. **Looks up Route53 hosted zone** by name
2. **Creates ACM certificate** in us-east-1 (required for CloudFront)
3. **Creates DNS validation records** automatically
4. **Waits for certificate validation** (typically 5-10 minutes)
5. **Creates Route53 A record** pointing to your CloudFront distribution

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| domain_name | Primary domain for certificate and DNS | string | - | yes |
| subject_alternative_names | Additional domains | list(string) | [] | no |
| hosted_zone_name | Route53 zone to use | string | "aztec.network" | no |
| create_dns_record | Create the A record | bool | true | no |
| cloudfront_domain_name | CloudFront domain for A record | string | "" | no* |
| cloudfront_zone_id | CloudFront zone for A record | string | "" | no* |
| tags | Tags to apply | map(string) | {} | no |

*Required if `create_dns_record = true`

## Outputs

| Name | Description |
|------|-------------|
| certificate_arn | ACM certificate ARN (validated) |
| certificate_domain | Domain name on certificate |
| route53_zone_id | Route53 hosted zone ID |
| dns_record_fqdn | FQDN of created DNS record |

## Multiple Domains

To cover multiple domains with one certificate:

```hcl
module "domain" {
  # ...
  domain_name               = "api.dev.sale.aztec.network"
  subject_alternative_names = [
    "api-v2.dev.sale.aztec.network",
    "*.api.dev.sale.aztec.network"
  ]
}
```

## Without DNS Record

If you want just the certificate (manage DNS separately):

```hcl
module "certificate" {
  # ...
  create_dns_record = false
}

# Manage DNS separately
resource "aws_route53_record" "custom" {
  # ... your custom DNS config
}
```

## Validation Time

The module **blocks** until certificate is validated:
- Typically: 5-10 minutes
- Sometimes: up to 30 minutes
- Terraform will wait automatically

## Benefits

- ✅ Single module call for complete setup
- ✅ No manual certificate validation
- ✅ No manual DNS record creation
- ✅ Certificate + DNS created together
- ✅ Automatic cleanup on destroy

## Example: ATP Indexer

```hcl
module "domain" {
  source = "../../terraform/modules/acm-certificate"
  
  providers = {
    aws.us_east_1 = aws.us_east_1
  }
  
  domain_name          = "indexer.${var.env}.stake.aztec.network"
  cloudfront_domain_name = aws_cloudfront_distribution.cf.domain_name
  cloudfront_zone_id     = aws_cloudfront_distribution.cf.hosted_zone_id
  
  tags = local.common_tags
}

resource "aws_cloudfront_distribution" "cf" {
  aliases = [module.domain.certificate_domain]
  
  viewer_certificate {
    acm_certificate_arn = module.domain.certificate_arn
    # ...
  }
}
```

## Troubleshooting

### "Certificate validation timeout"
- Check that Route53 validation records were created
- Verify hosted zone is correct
- Wait longer (sometimes takes 30+ minutes)

### "Certificate not found"
- Ensure provider `aws.us_east_1` is configured
- CloudFront requires certificates in us-east-1

### "DNS record already exists"
- Set `create_dns_record = false` if managing DNS separately
- Or delete conflicting record first

## Notes

- Certificate is created in **us-east-1** (CloudFront requirement)
- DNS records are created in the hosted zone's region
- Certificate validation is **automatic**
- On destroy, certificate is removed after DNS records

