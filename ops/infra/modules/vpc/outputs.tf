output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.coldyy_vpc.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = [for s in aws_subnet.coldyy_subnet : s.id]
}

output "subnet_azs" {
  description = "Map of subnet ID to AZ"
  value       = { for k, s in aws_subnet.coldyy_subnet : s.id => s.availability_zone }
}
