resource "aws_vpc" "coldyy_vpc" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "coldyy-vpc"
  }
}
locals {
  subnets = {
    for i, cidr in var.subnet_cidr_blocks :
    cidr => {
      cidr = cidr
      az   = var.availability_zones[i % length(var.availability_zones)]
    }
  }
}

resource "aws_subnet" "coldyy_subnet" {
  for_each          = local.subnets
  vpc_id            = aws_vpc.coldyy_vpc.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  map_public_ip_on_launch = true



  tags = {
    Name = "coldyy-subnet-${each.value.az}"
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }
}






resource "aws_internet_gateway" "coldyy_igw" {
  vpc_id = aws_vpc.coldyy_vpc.id
  tags = {
    Name = "coldyy-igw"
  }
}

resource "aws_route_table" "coldyy_rt" {
  vpc_id = aws_vpc.coldyy_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.coldyy_igw.id
  }

  tags = {
    Name = "coldyy-rt"
  }
}

resource "aws_route_table_association" "coldyy_rta" {
  for_each       = aws_subnet.coldyy_subnet
  subnet_id      = each.value.id
  route_table_id = aws_route_table.coldyy_rt.id
}
