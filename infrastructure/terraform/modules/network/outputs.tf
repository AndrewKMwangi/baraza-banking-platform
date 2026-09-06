output "network_name" {
  description = "Name of the Baraza network"
  value       = docker_network.this.name
}