variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hello"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS/GCP region"
  type        = string
  default     = "us-east-1"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_count" {
  description = "Number of nodes in the cluster"
  type        = number
  default     = 3
}

variable "node_type" {
  description = "Instance type for nodes"
  type        = string
  default     = "t3.medium"
}

variable "database_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "database_allocated_storage" {
  description = "Database storage in GB"
  type        = number
  default     = 20
}

variable "enable_monitoring" {
  description = "Enable CloudWatch/Stackdriver monitoring"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project     = "hello"
    ManagedBy   = "terraform"
  }
}
