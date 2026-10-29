provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "BarazaBankingPlatform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
