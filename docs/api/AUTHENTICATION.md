# Authentication

## Overview
Hello uses JWT-based authentication with refresh tokens.

## Authentication Flow
1. User sends credentials to `/api/auth/login`
2. Server validates and returns access + refresh tokens
3. Client stores tokens securely
4. Client includes access token in Authorization header
5. When access token expires, use refresh token to get new one

## Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

## Token Structure
- **Access Token:** Short-lived (1h), used for API requests
- **Refresh Token:** Long-lived (7d), used to get new access tokens

## Security
- Tokens are signed with HS256
- Refresh tokens are stored in database
- Logout invalidates refresh token
