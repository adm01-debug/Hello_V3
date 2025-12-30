# Security Policy

## Reporting Vulnerabilities
Report security issues to: security@hello.app

## Security Measures
- JWT with RS256 algorithm
- Password hashing with bcrypt (cost 12)
- Input validation with Zod
- SQL injection protection (parameterized queries)
- XSS protection (DOMPurify)
- CSRF tokens
- Rate limiting
- Security headers (Helmet)
- Audit logging

## Dependencies
- Automated dependency scanning (Dependabot)
- Regular security audits
- Zero-tolerance for critical vulnerabilities
