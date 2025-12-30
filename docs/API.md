# API Documentation - Hello Platform

**Base URL:** `https://api.hello.app`  
**Version:** v1  
**Last Updated:** 2025-12-30

---

## 🔐 Authentication

All API requests require authentication using JWT tokens.

### Getting a Token

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 👤 Users API

### Create User

**Endpoint:** `POST /api/users`

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "role": "user",
  "createdAt": "2025-12-30T10:00:00Z"
}
```

**Errors:**
- `400` - Validation error
- `409` - Email already exists
- `500` - Internal server error

---

### Get User by ID

**Endpoint:** `GET /api/users/:id`

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2025-12-30T10:00:00Z"
}
```

**Errors:**
- `404` - User not found
- `401` - Unauthorized

---

### Update User

**Endpoint:** `PATCH /api/users/:id`

**Request:**
```json
{
  "email": "updated@example.com"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "updated@example.com",
  "role": "user",
  "updatedAt": "2025-12-30T11:00:00Z"
}
```

---

### Delete User

**Endpoint:** `DELETE /api/users/:id`

**Response (204):** No content

**Errors:**
- `404` - User not found
- `403` - Forbidden

---

## 📞 Calls API

### Create Call

**Endpoint:** `POST /api/calls`

**Request:**
```json
{
  "contactId": "123e4567-e89b-12d3-a456-426614174000",
  "duration": 180,
  "type": "outbound",
  "notes": "Follow-up call"
}
```

**Response (201):**
```json
{
  "id": "987fcdeb-51a2-43f1-98ab-123456789abc",
  "contactId": "123e4567-e89b-12d3-a456-426614174000",
  "duration": 180,
  "type": "outbound",
  "notes": "Follow-up call",
  "createdAt": "2025-12-30T12:00:00Z"
}
```

---

## 🚀 Rate Limiting

**Limits:**
- Authenticated: 100 requests/15 min
- Unauthenticated: 20 requests/15 min

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735565400
```

---

## ❌ Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit |
| 500 | Server Error |
