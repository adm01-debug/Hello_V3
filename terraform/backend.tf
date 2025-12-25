terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
  
  backend "s3" {
    bucket         = "hello-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "hello-terraform-locks"
  }
}

provider "aws" {
  region = var.region
  
  default_tags {
    tags = var.tags
  }
}
