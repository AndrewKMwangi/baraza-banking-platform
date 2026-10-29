
resource "aws_launch_template" "worker" {
  name        = "${var.project_name}-${var.environment}-eks-workers"
  description = "Launch template for Baraza EKS worker nodes"

  vpc_security_group_ids = [
    aws_security_group.worker_nodes.id,
    aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
  ]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      encrypted             = true
      delete_on_termination = true
      volume_type           = "gp3"
    }
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name        = "${var.project_name}-${var.environment}-eks-worker"
      Project     = "BarazaBankingPlatform"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Tier        = "private-app"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-workers"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
