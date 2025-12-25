output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value       = module.kubernetes.cluster_endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Kubernetes cluster CA certificate"
  value       = module.kubernetes.cluster_ca_certificate
  sensitive   = true
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.endpoint
}

output "database_name" {
  description = "Database name"
  value       = module.database.name
}

output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = module.networking.load_balancer_ip
}

output "cdn_domain" {
  description = "CDN domain name"
  value       = module.cdn.domain
}

output "backup_bucket" {
  description = "S3/GCS bucket for backups"
  value       = module.storage.backup_bucket
}
