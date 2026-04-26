output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.coldyy_eks.name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = aws_eks_cluster.coldyy_eks.endpoint
}

output "cluster_ca_certificate" {
  description = "Base64 encoded cluster CA certificate"
  value       = aws_eks_cluster.coldyy_eks.certificate_authority[0].data
}

output "node_security_group_id" {
  description = "Security group ID of worker nodes — used by RDS to allow port 5432"
  value       = aws_security_group.eks_node_sg.id
}
