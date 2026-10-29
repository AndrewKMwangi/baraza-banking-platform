
variable "aws_region" {
  description = "AWS region for Baraza infrastructure"
  type        = string
  default     = "af-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "postgres_engine_version" {
  description = "Approved PostgreSQL engine version available in the target AWS region"
  type        = string
}
variable "kubernetes_version" {
  description = "Approved Kubernetes version supported by Amazon EKS in the target region"
  type        = string
}