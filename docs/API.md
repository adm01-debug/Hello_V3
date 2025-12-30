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
