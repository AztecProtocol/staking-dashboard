# IP Set for custom VPN/proxy IP addresses
resource "aws_wafv2_ip_set" "custom_vpn_ips" {
  count = var.enable_enhanced_vpn_detection && length(var.custom_vpn_ip_list) > 0 ? 1 : 0

  name  = "${var.name}-custom-vpn-ips"
  scope = var.scope

  ip_address_version = "IPV4"
  addresses          = var.custom_vpn_ip_list

  tags = var.tags
}

resource "aws_wafv2_web_acl" "this" {
  name  = var.name
  scope = var.scope

  default_action {
    allow {}
  }

  # Custom response bodies
  dynamic "custom_response_body" {
    for_each = var.custom_response_bodies
    content {
      key          = custom_response_body.key
      content      = custom_response_body.value.content
      content_type = custom_response_body.value.content_type
    }
  }

  # Rate limiting rule - Priority 1
  rule {
    name     = "${var.name}-rate-limit-rule"
    priority = 1

    action {
      block {
        custom_response {
          response_code            = 429
          custom_response_body_key = "rate_limit_exceeded"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
      metric_name                = "${var.name}-rate-limit-rule"
      sampled_requests_enabled   = var.sampled_requests_enabled
    }
  }

  # Size restriction rule - Priority 2
  dynamic "rule" {
    for_each = var.enable_size_restriction_rule ? [1] : []
    content {
      name     = "${var.name}-size-restriction-rule"
      priority = 2

      action {
        block {
          custom_response {
            response_code            = 413
            custom_response_body_key = "blocked_request"
          }
        }
      }

      statement {
        size_constraint_statement {
          field_to_match {
            body {
              oversize_handling = "MATCH"
            }
          }
          comparison_operator = "GT"
          size                = var.max_request_size_kb * 1024
          text_transformation {
            priority = 0
            type     = "NONE"
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-size-restriction-rule"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
      }
    }

  # IP Reputation List - Priority 3
  dynamic "rule" {
    for_each = var.enable_ip_reputation_list ? [1] : []
    content {
      name     = "${var.name}-ip-reputation"
      priority = 3

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesAmazonIpReputationList"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-ip-reputation"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  # Geographic blocking rule - Priority 4
  dynamic "rule" {
    for_each = var.enable_geo_blocking && length(var.blocked_countries) > 0 ? [1] : []
    content {
      name     = "${var.name}-geo-blocking"
      priority = 4

      action {
        block {
          custom_response {
            response_code            = 403
            custom_response_body_key = "blocked_request"
          }
        }
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-geo-blocking"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  # Ukrainian region blocking rule - Priority 6
  # This rule blocks specific Ukrainian regions based on labels added by the geo match rule
  dynamic "rule" {
    for_each = length(var.blocked_ukrainian_regions) > 0 ? [1] : []
    content {
      name     = "${var.name}-ukraine-region-blocking"
      priority = 6

      action {
        block {}
      }

      statement {
        and_statement {
          statement {
            label_match_statement {
              scope = "LABEL"
              key   = "awswaf:clientip:geo:country:UA"
            }
          }

          statement {
            or_statement {
              dynamic "statement" {
                for_each = var.blocked_ukrainian_regions
                content {
                  label_match_statement {
                    scope = "LABEL"
                    key   = "awswaf:clientip:geo:region:UA-${statement.value}"
                  }
                }
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-ukraine-region-blocking"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  # Custom VPN IP List - Priority 7
  dynamic "rule" {
    for_each = var.enable_enhanced_vpn_detection && length(var.custom_vpn_ip_list) > 0 ? [1] : []
    content {
      name     = "${var.name}-custom-vpn-ips"
      priority = 7

      dynamic "action" {
        for_each = var.vpn_detection_action == "block" ? [1] : []
        content {
          block {
            custom_response {
              response_code            = 403
              custom_response_body_key = "blocked_request"
            }
          }
        }
      }

      dynamic "action" {
        for_each = var.vpn_detection_action == "count" ? [1] : []
        content {
          count {}
        }
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.custom_vpn_ips[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-custom-vpn-ips"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  # AWS Managed Core Rule Set - Priority 10
  dynamic "rule" {
    for_each = var.enable_managed_core_rule_set ? [1] : []
    content {
      name     = "${var.name}-aws-core-rule-set"
      priority = 10

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesCommonRuleSet"
          vendor_name = "AWS"

          # Exclude rules that might cause false positives
          rule_action_override {
            action_to_use {
              count {}
            }
            name = "SizeRestrictions_BODY"
          }

          rule_action_override {
            action_to_use {
              count {}
            }
            name = "GenericRFI_BODY"
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-core-rule-set"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  # Known Bad Inputs Rule Set - Priority 11
  dynamic "rule" {
    for_each = var.enable_known_bad_inputs_rule_set ? [1] : []
    content {
      name     = "${var.name}-known-bad-inputs"
      priority = 11

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesKnownBadInputsRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-known-bad-inputs"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  # SQL Injection Rule Set - Priority 12
  dynamic "rule" {
    for_each = var.enable_sql_injection_rule_set ? [1] : []
    content {
      name     = "${var.name}-sql-injection"
      priority = 12

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesSQLiRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-sql-injection"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  dynamic "rule" {
    for_each = var.enable_bot_control_rule_set ? [1] : []
    content {
      name     = "${var.name}-bot-control"
      priority = 13

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesBotControlRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-bot-control"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  dynamic "rule" {
    for_each = var.enable_anon_ip_rule_set ? [1] : []
    content {
      name     = "${var.name}-anon-ip"
      priority = 14

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesAnonymousIpList"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
        metric_name                = "${var.name}-anon-ip"
        sampled_requests_enabled   = var.sampled_requests_enabled
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
    metric_name                = var.name
    sampled_requests_enabled   = var.sampled_requests_enabled
  }

  tags = var.tags
}
