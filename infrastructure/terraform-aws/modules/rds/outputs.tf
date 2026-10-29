
output "db_instance_id" {
  description = "Identifier of the Baraza PostgreSQL DB instance"
  value       = aws_db_instance.this.id
}

output "db_endpoint" {
  description = "Hostname and port endpoint for the PostgreSQL DB instance"
  value       = aws_db_instance.this.endpoint
}

output "db_port" {
  description = "Port used by the PostgreSQL DB instance"
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Name of the initial PostgreSQL database"
  value       = aws_db_instance.this.db_name
}

output "db_security_group_id" {
  description = "Security Group ID controlling access to the database"
  value       = aws_security_group.database.id
}
