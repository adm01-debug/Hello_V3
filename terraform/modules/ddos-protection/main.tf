# DDoS Protection Module
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_shield_protection" "hello" {
  name         = "hello-ddos-protection"
  resource_arn = var.load_balancer_arn
  
  tags = {
    Name        = "hello-ddos-protection"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_wafv2_web_acl" "ddos" {
  name  = "hello-ddos-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    action {
      block {
        custom_response {
          response_code = 429
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Geographic restriction
  rule {
    name     = "GeoBlocking"
    priority = 2

    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlocking"
      sampled_requests_enabled   = true
    }
  }

  # Known bad inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "HelloDDoSACL"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "hello-ddos-acl"
    Environment = var.environment
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = var.load_balancer_arn
  web_acl_arn  = aws_wafv2_web_acl.ddos.arn
}

resource "aws_cloudwatch_metric_alarm" "ddos_detected" {
  alarm_name          = "hello-ddos-detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "DDoS attack detected - high number of blocked requests"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    WebACL = aws_wafv2_web_acl.ddos.name
    Region = var.aws_region
  }
}

variable "load_balancer_arn" {
  description = "ARN of the load balancer to protect"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
}

output "waf_acl_arn" {
  value       = aws_wafv2_web_acl.ddos.arn
  description = "WAF ACL ARN"
}

output "shield_protection_id" {
  value       = aws_shield_protection.hello.id
  description = "Shield Protection ID"
}
