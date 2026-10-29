variable "project_name" {
  description = "Prefix used to name Baraza network resources"
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

variable "vpc_cidr" {
  description = "IPv4 CIDR range allocated to the Baraza VPC"
  type        = string
  default     = "10.20.0.0/16"

  validation {
    condition = (
      can(cidrnetmask(var.vpc_cidr)) &&
      try(tonumber(split("/", var.vpc_cidr)[1]), 0) >= 16 &&
      try(tonumber(split("/", var.vpc_cidr)[1]), 0) <= 28
    )
    error_message = "Provide a valid IPv4 CIDR for the VPC with a prefix between /16 and /28."
  }
}

variable "availability_zones" {
  description = "AWS Availability Zones used by the network"
  type        = list(string)
  default     = ["af-south-1a", "af-south-1b"]

  validation {
    condition = (
      length(var.availability_zones) >= 2 &&
      length(var.availability_zones) == length(distinct(var.availability_zones))
    )
    error_message = "Provide at least two unique Availability Zones for resilience."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR ranges for public subnets, one per Availability Zone"
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]

  validation {
    condition = (
      length(var.public_subnet_cidrs) == length(var.availability_zones) &&
      alltrue([
        for cidr in var.public_subnet_cidrs :
        can(cidrnetmask(cidr))
      ])
    )
    error_message = "Provide one valid IPv4 public subnet CIDR per Availability Zone."
  }
}

variable "private_app_subnet_cidrs" {
  description = "CIDR ranges for private application subnets"
  type        = list(string)
  default     = ["10.20.11.0/24", "10.20.12.0/24"]

  validation {
    condition = (
      length(var.private_app_subnet_cidrs) == length(var.availability_zones) &&
      alltrue([
        for cidr in var.private_app_subnet_cidrs :
        can(cidrnetmask(cidr))
      ])
    )
    error_message = "Provide one valid IPv4 private application subnet CIDR per Availability Zone."
  }
}

variable "private_db_subnet_cidrs" {
  description = "CIDR ranges for private database subnets"
  type        = list(string)
  default     = ["10.20.21.0/24", "10.20.22.0/24"]

  validation {
    condition = (
      length(var.private_db_subnet_cidrs) == length(var.availability_zones) &&
      alltrue([
        for cidr in var.private_db_subnet_cidrs :
        can(cidrnetmask(cidr))
      ])
    )
    error_message = "Provide one valid IPv4 private database subnet CIDR per Availability Zone."
  }
}
