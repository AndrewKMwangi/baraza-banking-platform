variable "project_name" {
  description = "Project prefix used to name Baraza VPC endpoints"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region where the VPC endpoints will be created"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC hosting the endpoints"
  type        = string
}

variable "private_app_subnet_ids" {
  description = "Private application subnet IDs for interface endpoints"
  type        = list(string)

  validation {
    condition     = length(var.private_app_subnet_ids) >= 2
    error_message = "Provide at least two private application subnets."
  }
}

variable "private_app_subnet_cidrs" {
  description = "CIDR ranges allowed to access the interface endpoints"
  type        = list(string)

  validation {
    condition = (
      length(var.private_app_subnet_cidrs) >= 2 &&
      alltrue([
        for cidr in var.private_app_subnet_cidrs :
        can(cidrnetmask(cidr))
      ])
    )
    error_message = "Provide at least two valid IPv4 application subnet CIDRs."
  }
}

variable "private_app_route_table_ids" {
  description = "Route table IDs to associate with the S3 gateway endpoint"
  type        = list(string)

  validation {
    condition     = length(var.private_app_route_table_ids) >= 1
    error_message = "Provide at least one private application route table ID."
  }
}