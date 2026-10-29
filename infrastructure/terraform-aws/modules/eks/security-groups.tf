
resource "aws_security_group" "worker_nodes" {
  name        = "${var.project_name}-${var.environment}-eks-nodes-sg"
  description = "Security group for Baraza EKS worker nodes"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow communication between approved worker nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    description = "Allow outbound traffic for EKS node operations"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-nodes-sg"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Tier        = "private-app"
  }
}
