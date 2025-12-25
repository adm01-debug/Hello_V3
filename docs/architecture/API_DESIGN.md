# API Design

## REST Principles
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Use proper status codes
- Version API (/api/v1/)
- Return JSON responses

## Endpoints

### Calls
```
GET    /api/v1/calls
POST   /api/v1/calls
GET    /api/v1/calls/:id
PUT    /api/v1/calls/:id
DELETE /api/v1/calls/:id
```

### Contacts
```
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
```

## Authentication
- Bearer token in Authorization header
- JWT tokens with 1h expiration
- Refresh tokens for renewal

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per IP
