output "vpc_id" {
  description = "ID of the Baraza VPC"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "IDs of the private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "IDs of the private database subnets"
  value       = aws_subnet.private_db[*].id
}

output "vpc_cidr" {
  description = "CIDR range allocated to the Baraza VPC"
  value       = aws_vpc.this.cidr_block
}

output "private_app_route_table_ids" {
  description = "Route table IDs for private application subnets"
  value       = [aws_route_table.private_app.id]
}

output "private_app_subnet_cidrs" {
  description = "CIDR ranges of the private application subnets"
  value       = aws_subnet.private_app[*].cidr_block
}