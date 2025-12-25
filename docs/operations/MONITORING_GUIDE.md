# Monitoring Guide

## Metrics to Monitor
- Request rate
- Error rate
- Response time (p50, p95, p99)
- CPU usage
- Memory usage
- Active connections

## Tools
- Grafana: Dashboards
- Prometheus: Metrics collection
- Sentry: Error tracking
- Supabase: Database metrics

## Dashboards
- System Overview: `/grafana/system`
- Application Metrics: `/grafana/app`
- Error Rates: `/grafana/errors`

## Alerts
- High error rate (>5%)
- Slow responses (p95 >1s)
- High CPU (>80%)
- High memory (>90%)

## Log Locations
- Application logs: `/var/log/hello/app.log`
- Error logs: `/var/log/hello/error.log`
- Access logs: `/var/log/nginx/access.log`
