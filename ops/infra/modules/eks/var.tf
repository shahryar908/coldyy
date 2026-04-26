variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
}

variable "cluster_version" {
  type        = string
  description = "Kubernetes version e.g. \"1.29\""
}

variable "vpc_id" {
  type        = string
  description = "VPC ID from the VPC module"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs from the VPC module"
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for worker nodes e.g. \"t3.medium\""
  default     = "t3.medium"
}

variable "node_desired_size" {
  type        = number
  description = "Desired number of worker nodes"
  default     = 2
}

variable "node_min_size" {
  type        = number
  description = "Minimum number of worker nodes"
  default     = 1
}

variable "node_max_size" {
  type        = number
  description = "Maximum number of worker nodes"
  default     = 4
}

variable "capacity_type" {
  type        = string
  description = "ON_DEMAND or SPOT — SPOT is ~70% cheaper but can be interrupted"
  default     = "ON_DEMAND"
}

variable "disk_size" {
  type        = number
  description = "Disk size in GiB for each worker node"
  default     = 20
}
