# Security Checklist

## Development
- [ ] No secrets in code
- [ ] Environment variables for sensitive data
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF protection enabled

## Authentication & Authorization
- [ ] Strong password requirements
- [ ] Rate limiting on login attempts
- [ ] Session timeout configured
- [ ] JWT tokens properly validated
- [ ] Role-based access control implemented
- [ ] API keys rotated regularly

## Infrastructure
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Database encrypted at rest
- [ ] Backups encrypted
- [ ] Network policies in place

## Dependencies
- [ ] Dependencies up to date
- [ ] Dependabot enabled
- [ ] Security scans in CI/CD
- [ ] License compliance checked

## Monitoring
- [ ] Security events logged
- [ ] Failed login attempts tracked
- [ ] Anomaly detection configured
- [ ] Incident response plan documented
