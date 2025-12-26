# Disaster Recovery Plan

## RTO & RPO
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 15 minutes

## Backup Strategy
### Database
- Full backup: Daily at 2 AM UTC
- Incremental: Every 6 hours
- Retention: 30 days

### Application Data
- Continuous replication to S3
- Cross-region backup

## Recovery Procedures
### Database Failure
1. Switch to read replica
2. Promote replica to primary
3. Update DNS records
4. Verify data integrity

### Complete Region Failure
1. Activate disaster recovery site
2. Restore latest backup
3. Update Route53 to DR region
4. Validate all services

## Testing Schedule
- Monthly DR drills
- Quarterly full recovery test
