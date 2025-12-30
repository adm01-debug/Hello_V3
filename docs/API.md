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

**Response (200):**
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

**Headers Required:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Error Responses:**
- `401` - Invalid credentials
- `400` - Validation error
- `429` - Rate limit exceeded

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

**Validation Rules:**
- Email must be valid format
- Password minimum 8 characters
- Role must be: user, admin, moderator

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
  "createdAt": "2025-12-30T10:00:00Z",
  "updatedAt": "2025-12-30T11:00:00Z"
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

**Permissions:**
- Users can update their own profile
- Admins can update any user

---

### Delete User

**Endpoint:** `DELETE /api/users/:id`

**Response (204):** No content

**Permissions:**
- Only admins can delete users
- Cannot delete own account
- Cannot delete last admin

**Errors:**
- `404` - User not found
- `403` - Forbidden

---

### List Users

**Endpoint:** `GET /api/users`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `role` (filter by role)
- `search` (search by email)

**Example:** `GET /api/users?page=1&limit=20&role=admin`

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-12-30T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

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
  "notes": "Follow-up call about proposal"
}
```

**Response (201):**
```json
{
  "id": "987fcdeb-51a2-43f1-98ab-123456789abc",
  "contactId": "123e4567-e89b-12d3-a456-426614174000",
  "duration": 180,
  "type": "outbound",
  "notes": "Follow-up call about proposal",
  "createdAt": "2025-12-30T12:00:00Z"
}
```

**Call Types:**
- `outbound` - Outgoing call
- `inbound` - Incoming call

---

### List Calls

**Endpoint:** `GET /api/calls`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `type` (outbound, inbound)
- `contactId` (filter by contact)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Example:** `GET /api/calls?type=outbound&startDate=2025-12-01`

**Response (200):**
```json
{
  "data": [
    {
      "id": "987fcdeb-51a2-43f1-98ab-123456789abc",
      "contactId": "123e4567-e89b-12d3-a456-426614174000",
      "duration": 180,
      "type": "outbound",
      "createdAt": "2025-12-30T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25
  }
}
```

---

## 📇 Contacts API

### Create Contact

**Endpoint:** `POST /api/contacts`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Inc"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Inc",
  "createdAt": "2025-12-30T13:00:00Z"
}
```

---

### Get Contact

**Endpoint:** `GET /api/contacts/:id`

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Inc",
  "createdAt": "2025-12-30T13:00:00Z",
  "callsCount": 15
}
```

---

## 🚀 Rate Limiting

**Limits:**
- Authenticated: 100 requests/15 minutes
- Unauthenticated: 20 requests/15 minutes

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735565400
```

**Error (429):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 300
}
```

---

## ❌ Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

**Error Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email already exists"
  }
}
```
