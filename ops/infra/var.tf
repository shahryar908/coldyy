variable "aws_region" {
  type=string
  description = "value for your aws region"
}

variable "vpc_cidr_block" {
  type = string
}

variable "subnet_cidr_blocks" {
  type = list(string)
  
}

variable "availability_zones" {
  type = list(string)
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name — used for kubernetes.io subnet tags"
}

variable "cluster_version" {
  type        = string
  description = "Kubernetes version e.g. \"1.29\""
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for worker nodes e.g. \"t3.medium\""
  default     = "t3.medium"
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "argocd_chart_version" {
  type        = string
  description = "ArgoCD Helm chart version e.g. \"6.7.3\""
  default     = "6.7.3"
}

