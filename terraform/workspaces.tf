variable "environment" {
  type = string
}

resource "null_resource" "workspace" {
  provisioner "local-exec" {
    command = "terraform workspace select ${var.environment} || terraform workspace new ${var.environment}"
  }
}
