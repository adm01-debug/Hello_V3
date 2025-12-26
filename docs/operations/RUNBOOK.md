# Operations Runbook

## Daily Operations

### Health Checks
```bash
kubectl get pods
kubectl logs -f deployment/hello
curl https://api.hello.app/health
```

### Metrics Review
- Check Datadog dashboard
- Review error rates
- Monitor API latency

## Common Issues

### High CPU Usage
1. Check pod metrics: `kubectl top pods`
2. Scale up: `kubectl scale deployment hello --replicas=5`
3. Investigate logs for errors

### Database Connection Issues
1. Check connection pool: `psql -c "SELECT * FROM pg_stat_activity"`
2. Verify credentials
3. Check network policies

### Deployment Failures
1. Check events: `kubectl describe deployment hello`
2. Review pod logs
3. Rollback if needed: `kubectl rollout undo deployment/hello`

## Escalation
- Level 1: On-call engineer
- Level 2: Team lead
- Level 3: CTO
