# HashiCorp Vault Module
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"
    }
  }
}

resource "vault_mount" "hello" {
  path        = "hello"
  type        = "kv-v2"
  description = "Hello application secrets"

  options = {
    version = "2"
  }
}

resource "vault_kv_secret_v2" "database" {
  mount = vault_mount.hello.path
  name  = "database"

  data_json = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = var.db_host
    port     = var.db_port
    database = var.db_name
  })
}

resource "vault_kv_secret_v2" "supabase" {
  mount = vault_mount.hello.path
  name  = "supabase"

  data_json = jsonencode({
    url      = var.supabase_url
    anon_key = var.supabase_anon_key
    service_key = var.supabase_service_key
  })
}

resource "vault_kv_secret_v2" "api_keys" {
  mount = vault_mount.hello.path
  name  = "api-keys"

  data_json = jsonencode({
    openai   = var.openai_api_key
    stripe   = var.stripe_api_key
    sentry   = var.sentry_dsn
  })
}

resource "vault_policy" "hello_app" {
  name = "hello-app"

  policy = <<EOT
# Read access to application secrets
path "hello/data/*" {
  capabilities = ["read", "list"]
}

# Allow renewal of own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow lookup of own token
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOT
}

resource "vault_policy" "hello_admin" {
  name = "hello-admin"

  policy = <<EOT
# Full access to application secrets
path "hello/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage policies
path "sys/policies/acl/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOT
}

resource "vault_auth_backend" "kubernetes" {
  type = "kubernetes"
  path = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "k8s" {
  backend            = vault_auth_backend.kubernetes.path
  kubernetes_host    = var.kubernetes_host
  kubernetes_ca_cert = var.kubernetes_ca_cert
}

resource "vault_kubernetes_auth_backend_role" "hello" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "hello-app"
  bound_service_account_names      = ["hello"]
  bound_service_account_namespaces = ["default"]
  token_ttl                        = 3600
  token_policies                   = [vault_policy.hello_app.name]
}

variable "db_username" { type = string }
variable "db_password" { type = string, sensitive = true }
variable "db_host" { type = string }
variable "db_port" { type = number }
variable "db_name" { type = string }
variable "supabase_url" { type = string }
variable "supabase_anon_key" { type = string, sensitive = true }
variable "supabase_service_key" { type = string, sensitive = true }
variable "openai_api_key" { type = string, sensitive = true }
variable "stripe_api_key" { type = string, sensitive = true }
variable "sentry_dsn" { type = string, sensitive = true }
variable "kubernetes_host" { type = string }
variable "kubernetes_ca_cert" { type = string }

output "vault_mount_path" {
  value = vault_mount.hello.path
}

output "app_role_name" {
  value = vault_kubernetes_auth_backend_role.hello.role_name
}
