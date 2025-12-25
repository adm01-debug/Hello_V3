# Rate Limiting

## Limits
- **Per User:** 100 requests/minute
- **Per IP:** 1000 requests/hour
- **Burst:** 20 requests in 1 second

## Headers
Response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Status Codes
- `429 Too Many Requests`: Rate limit exceeded
- `Retry-After`: Seconds until limit resets

## Implementation
Uses token bucket algorithm with Redis backend.

## Exemptions
- Internal services (whitelisted IPs)
- Premium tier users (higher limits)

## Best Practices
- Implement exponential backoff
- Cache responses when possible
- Batch requests
- Use webhooks instead of polling
