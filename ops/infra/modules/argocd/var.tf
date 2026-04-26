variable "argocd_namespace" {
  type        = string
  description = "Kubernetes namespace to install ArgoCD into"
  default     = "argocd"
}

variable "argocd_chart_version" {
  type        = string
  description = "ArgoCD Helm chart version e.g. \"6.7.3\""
}

variable "vpc_id" {
  type        = string
  description = "VPC ID — needed by AWS Load Balancer Controller"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name — needed by AWS Load Balancer Controller"
}
