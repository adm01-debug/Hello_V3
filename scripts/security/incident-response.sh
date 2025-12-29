#!/bin/bash

set -euo pipefail

# Configuration
LOG_FILE="/var/log/incident-response.log"
ALERT_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${ALERT_EMAIL:-security@hello.app}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Alert function
alert() {
    local message="$1"
    log "ALERT: $message"
    
    # Send to Slack if webhook configured
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"🚨 INCIDENT: $message\"}" \
            2>/dev/null || log "Failed to send Slack alert"
    fi
    
    # Send email
    echo "$message" | mail -s "Security Incident Alert" "$EMAIL_RECIPIENTS" 2>/dev/null || \
        log "Failed to send email alert"
}

# Incident handlers
handle_data_breach() {
    log "Handling data breach incident"
    
    # 1. Notify security team
    alert "Data breach detected! Initiating response protocol."
    
    # 2. Revoke all API keys
    log "Revoking all API keys..."
    psql "$DATABASE_URL" -c "UPDATE api_keys SET revoked = true WHERE revoked = false;" || \
        log "ERROR: Failed to revoke API keys"
    
    # 3. Force password reset for all users
    log "Forcing password reset for all users..."
    psql "$DATABASE_URL" -c "UPDATE users SET password_reset_required = true;" || \
        log "ERROR: Failed to force password resets"
    
    # 4. Create database snapshot
    log "Creating database snapshot..."
    pg_dump "$DATABASE_URL" > "/backups/breach-$(date +%Y%m%d-%H%M%S).sql" || \
        log "ERROR: Failed to create database snapshot"
    
    # 5. Enable enhanced logging
    log "Enabling enhanced audit logging..."
    kubectl set env deployment/hello AUDIT_LEVEL=verbose || \
        log "ERROR: Failed to enable enhanced logging"
    
    log "Data breach response completed"
}

handle_ddos_attack() {
    log "Handling DDoS attack"
    
    alert "DDoS attack detected! Scaling infrastructure."
    
    # 1. Scale up infrastructure
    log "Scaling up replicas..."
    kubectl scale deployment/hello --replicas=10 || \
        log "ERROR: Failed to scale deployment"
    
    # 2. Enable aggressive rate limiting
    log "Enabling aggressive rate limiting..."
    kubectl apply -f /config/rate-limit-strict.yaml || \
        log "ERROR: Failed to apply rate limits"
    
    # 3. Activate DDoS mitigation
    log "Activating DDoS mitigation..."
    aws shield describe-protection --resource-arn "$RESOURCE_ARN" || \
        log "ERROR: Shield protection check failed"
    
    log "DDoS response completed"
}

handle_unauthorized_access() {
    log "Handling unauthorized access attempt"
    
    local user_id="${1:-unknown}"
    local ip_address="${2:-unknown}"
    
    alert "Unauthorized access from IP: $ip_address, User: $user_id"
    
    # 1. Block IP address
    log "Blocking IP address: $ip_address"
    kubectl exec -it deployment/nginx -- \
        bash -c "echo 'deny $ip_address;' >> /etc/nginx/blocked-ips.conf && nginx -s reload" || \
        log "ERROR: Failed to block IP"
    
    # 2. Suspend user account
    if [ "$user_id" != "unknown" ]; then
        log "Suspending user account: $user_id"
        psql "$DATABASE_URL" -c "UPDATE users SET suspended = true WHERE id = '$user_id';" || \
            log "ERROR: Failed to suspend user"
    fi
    
    # 3. Increase monitoring
    log "Increasing monitoring sensitivity..."
    
    log "Unauthorized access response completed"
}

handle_malware_detected() {
    log "Handling malware detection"
    
    alert "Malware detected! Initiating isolation protocol."
    
    # 1. Isolate affected container
    log "Isolating affected container..."
    kubectl cordon "$(kubectl get nodes -o name | head -1)" || \
        log "ERROR: Failed to cordon node"
    
    # 2. Create forensic snapshot
    log "Creating forensic snapshot..."
    docker commit "$CONTAINER_ID" "forensics-$(date +%Y%m%d-%H%M%S)" || \
        log "ERROR: Failed to create forensic snapshot"
    
    # 3. Scan all containers
    log "Scanning all containers..."
    trivy image --severity HIGH,CRITICAL hello:latest || \
        log "ERROR: Trivy scan failed"
    
    log "Malware response completed"
}

handle_suspicious_activity() {
    log "Handling suspicious activity"
    
    local activity_type="${1:-unknown}"
    
    alert "Suspicious activity detected: $activity_type"
    
    # 1. Increase audit logging
    log "Increasing audit logging..."
    kubectl set env deployment/hello LOG_LEVEL=debug || \
        log "ERROR: Failed to increase logging"
    
    # 2. Capture network traffic
    log "Capturing network traffic sample..."
    timeout 60 tcpdump -i any -w "/captures/suspicious-$(date +%Y%m%d-%H%M%S).pcap" || \
        log "ERROR: Failed to capture traffic"
    
    log "Suspicious activity response completed"
}

# Main incident response dispatcher
main() {
    local incident_type="${1:-}"
    
    if [ -z "$incident_type" ]; then
        echo "Usage: $0 <incident_type> [additional_args...]"
        echo "Incident types: data_breach, ddos_attack, unauthorized_access, malware_detected, suspicious_activity"
        exit 1
    fi
    
    log "Incident response triggered: $incident_type"
    
    case "$incident_type" in
        data_breach)
            handle_data_breach
            ;;
        ddos_attack)
            handle_ddos_attack
            ;;
        unauthorized_access)
            handle_unauthorized_access "${2:-}" "${3:-}"
            ;;
        malware_detected)
            handle_malware_detected
            ;;
        suspicious_activity)
            handle_suspicious_activity "${2:-}"
            ;;
        *)
            log "ERROR: Unknown incident type: $incident_type"
            exit 1
            ;;
    esac
    
    log "Incident response completed for: $incident_type"
}

# Trap errors
trap 'log "ERROR: Script failed at line $LINENO"' ERR

# Execute
main "$@"
