
resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.project_name}-${var.environment}-workers"
  node_role_arn   = aws_iam_role.nodes.arn
  subnet_ids      = var.private_app_subnet_ids

  instance_types = var.node_instance_types

  launch_template {
    id      = aws_launch_template.worker.id
    version = tostring(aws_launch_template.worker.latest_version)
  }

  scaling_config {
    desired_size = var.node_desired_size
    min_size     = var.node_min_size
    max_size     = var.node_max_size
  }

  update_config {
    max_unavailable = 1
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-workers"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Tier        = "private-app"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_worker_policy,
    aws_iam_role_policy_attachment.node_ecr_policy
  ]
}
