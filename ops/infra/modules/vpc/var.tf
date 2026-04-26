variable "vpc_cidr_block" {
  type        = string
  description = "CIDR block for the VPC e.g. 10.0.0.0/16"
}

variable "subnet_cidr_blocks" {
  type        = list(string)
  description = "List of CIDRs for public subnets e.g. [\"10.0.1.0/24\", \"10.0.2.0/24\", \"10.0.3.0/24\"]"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of AZs to spread subnets across e.g. [\"us-east-1a\", \"us-east-1b\", \"us-east-1c\"]"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name — used for kubernetes.io subnet tags"
}
