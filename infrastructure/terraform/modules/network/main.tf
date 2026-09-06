terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

resource "docker_network" "this" {
  name = "baraza-network-${var.environment}"
}