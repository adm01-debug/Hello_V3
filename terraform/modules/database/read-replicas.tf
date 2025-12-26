# Read Replicas Configuration
resource "aws_db_instance" "read_replica_1" {
  identifier             = "${var.db_identifier}-read-1"
  replicate_source_db    = var.primary_db_identifier
  instance_class         = var.replica_instance_class
  publicly_accessible    = false
  skip_final_snapshot    = true
  
  # Performance optimizations
  parameter_group_name   = aws_db_parameter_group.read_replica.name
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval    = 60
  monitoring_role_arn    = aws_iam_role.rds_monitoring.arn
  
  # Backup (for potential promotion)
  backup_retention_period = 7
  
  tags = {
    Name        = "${var.db_identifier}-read-1"
    Environment = var.environment
    Type        = "read-replica"
  }
}

resource "aws_db_instance" "read_replica_2" {
  identifier             = "${var.db_identifier}-read-2"
  replicate_source_db    = var.primary_db_identifier
  instance_class         = var.replica_instance_class
  publicly_accessible    = false
  skip_final_snapshot    = true
  availability_zone      = var.replica_2_az
  
  parameter_group_name   = aws_db_parameter_group.read_replica.name
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval    = 60
  monitoring_role_arn    = aws_iam_role.rds_monitoring.arn
  backup_retention_period = 7
  
  tags = {
    Name        = "${var.db_identifier}-read-2"
    Environment = var.environment
    Type        = "read-replica"
  }
}

resource "aws_db_parameter_group" "read_replica" {
  name   = "${var.db_identifier}-read-replica-params"
  family = "postgres14"
  
  # Optimizations for read-heavy workloads
  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }
  
  parameter {
    name  = "effective_cache_size"
    value = "24GB"
  }
  
  parameter {
    name  = "shared_buffers"
    value = "8GB"
  }
  
  parameter {
    name  = "max_connections"
    value = "200"
  }
}

# Route53 for read replica endpoints
resource "aws_route53_record" "read_replica" {
  zone_id = var.route53_zone_id
  name    = "db-read.hello.app"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 50
  }
  
  set_identifier = "replica-1"
  records        = [aws_db_instance.read_replica_1.address]
}

resource "aws_route53_record" "read_replica_2" {
  zone_id = var.route53_zone_id
  name    = "db-read.hello.app"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 50
  }
  
  set_identifier = "replica-2"
  records        = [aws_db_instance.read_replica_2.address]
}

# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "replica_lag" {
  alarm_name          = "${var.db_identifier}-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "Replica lag is too high"
  alarm_actions       = [var.sns_topic_arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.read_replica_1.id
  }
}

variable "db_identifier" { type = string }
variable "primary_db_identifier" { type = string }
variable "replica_instance_class" { type = string, default = "db.t3.large" }
variable "environment" { type = string }
variable "replica_2_az" { type = string }
variable "route53_zone_id" { type = string }
variable "sns_topic_arn" { type = string }

output "read_replica_1_endpoint" {
  value = aws_db_instance.read_replica_1.endpoint
}

output "read_replica_2_endpoint" {
  value = aws_db_instance.read_replica_2.endpoint
}

output "read_endpoint" {
  value = "db-read.hello.app"
}
