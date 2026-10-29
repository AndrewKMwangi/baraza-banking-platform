output "project_name" {
  description = "Name of the Baraza platform"
  value       = local.project_name
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "aws_region" {
  description = "Configured AWS region"
  value       = var.aws_region
}
