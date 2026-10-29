
output "worker_security_group_id" {
  description = "Security group ID for Baraza EKS worker nodes"
  value       = aws_security_group.worker_nodes.id
}

output "cluster_role_arn" {
  description = "ARN of the IAM role assumed by the Amazon EKS control plane"
  value       = aws_iam_role.cluster.arn
}

output "node_role_arn" {
  description = "ARN of the IAM role assumed by Baraza EKS worker nodes"
  value       = aws_iam_role.nodes.arn
}
