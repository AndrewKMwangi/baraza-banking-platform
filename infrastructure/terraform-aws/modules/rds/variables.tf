
variable "project_name" {
  description = "Project prefix used to name Baraza database resources"
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

variable "private_db_subnet_ids" {
  description = "IDs of private database subnets across Availability Zones"
  type        = list(string)

  validation {
    condition     = length(var.private_db_subnet_ids) >= 2
    error_message = "Provide at least two private database subnets for resilience."
  }
}

variable "application_security_group_id" {
  description = "Security Group ID of the approved application workloads"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC that contains the database subnets"
  type        = string
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database"
  type        = string
  default     = "baraza"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{0,62}$", var.db_name))
    error_message = "The database name must start with a letter and contain only letters, numbers, or underscores, up to 63 characters."
  }
}

variable "master_username" {
  description = "Master username for the PostgreSQL database"
  type        = string
  default     = "baraza_admin"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{0,62}$", var.master_username))
    error_message = "Provide a valid PostgreSQL master username."
  }
}

variable "engine_version" {
  description = "Approved PostgreSQL engine version for the target AWS region"
  type        = string
}

variable "instance_class" {
  description = "Amazon RDS DB instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Initial database storage in GiB"
  type        = number
  default     = 20

  validation {
    condition = (
      var.allocated_storage >= 20 &&
      var.allocated_storage <= 65536 &&
      floor(var.allocated_storage) == var.allocated_storage
    )
    error_message = "Allocated storage must be a whole number between 20 and 65536 GiB."
  }
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7

  validation {
    condition = (
      var.backup_retention_period >= 1 &&
      var.backup_retention_period <= 35 &&
      floor(var.backup_retention_period) == var.backup_retention_period
    )
    error_message = "Backup retention must be a whole number of days between 1 and 35."
  }
}

variable "deletion_protection" {
  description = "Whether AWS should prevent accidental database deletion"
  type        = bool
  default     = true
}

variable "final_snapshot_identifier" {
  description = "Identifier for the final RDS snapshot created during database deletion"
  type        = string

  validation {
    condition = (
      length(var.final_snapshot_identifier) >= 1 &&
      length(var.final_snapshot_identifier) <= 255 &&
      can(regex("^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$", var.final_snapshot_identifier)) &&
      !strcontains(var.final_snapshot_identifier, "--")
    )
    error_message = "The final snapshot identifier must start with a letter, contain only letters, numbers, or hyphens, be 1-255 characters long, not end with a hyphen, and not contain consecutive hyphens."
  }
}
