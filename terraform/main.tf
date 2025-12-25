# Main Terraform configuration using modules

module "networking" {
  source = "./modules/networking"
  
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
}

module "kubernetes" {
  source = "./modules/kubernetes"
  
  project_name       = var.project_name
  environment        = var.environment
  kubernetes_version = var.kubernetes_version
  node_count         = var.node_count
  node_type          = var.node_type
  
  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.private_subnet_ids
}

module "database" {
  source = "./modules/database"
  
  project_name          = var.project_name
  environment           = var.environment
  instance_class        = var.database_instance_class
  allocated_storage     = var.database_allocated_storage
  backup_retention_days = var.backup_retention_days
  
  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.private_subnet_ids
}

module "storage" {
  source = "./modules/storage"
  
  project_name = var.project_name
  environment  = var.environment
}

module "cdn" {
  source = "./modules/cdn"
  
  project_name = var.project_name
  environment  = var.environment
  
  origin_domain = module.networking.load_balancer_dns
}

module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  enable_monitoring = var.enable_monitoring
}
