
variable "project_name" {
  description = "Project prefix used to name Baraza EKS resources"
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

variable "vpc_id" {
  description = "ID of the VPC hosting the EKS cluster and worker nodes"
  type        = string
}

variable "private_app_subnet_ids" {
  description = "Private application subnet IDs used by EKS across Availability Zones"
  type        = list(string)

  validation {
    condition     = length(var.private_app_subnet_ids) >= 2
    error_message = "Provide at least two private application subnets for EKS resilience."
  }
}
variable "kubernetes_version" {
  description = "Approved Kubernetes version supported by Amazon EKS in the target region"
  type        = string
}

variable "node_instance_types" {
  description = "EC2 instance types for the EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]

  validation {
    condition     = length(var.node_instance_types) > 0
    error_message = "Provide at least one EC2 instance type."
  }
}

variable "node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2

  validation {
    condition = (
      var.node_desired_size >= 1 &&
      floor(var.node_desired_size) == var.node_desired_size
    )
    error_message = "The desired node count must be a whole number of at least one."
  }
}

variable "node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 3

  validation {
    condition = (
      var.node_max_size >= 1 &&
      var.node_max_size >= var.node_desired_size &&
      floor(var.node_max_size) == var.node_max_size
    )
    error_message = "The maximum node count must be a whole number of at least one and must be greater than or equal to the desired node count."
  }
}
variable "node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 1

  validation {
    condition = (
      var.node_min_size >= 1 &&
      floor(var.node_min_size) == var.node_min_size &&
      var.node_min_size <= var.node_desired_size &&
      var.node_min_size <= var.node_max_size
    )
    error_message = "The minimum node count must be a whole number of at least one and cannot exceed the desired or maximum node count."
  }
}
