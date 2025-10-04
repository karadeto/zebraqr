# Auth API Contracts

**Base Path**: `/api/auth`

---

## POST /api/auth/register

Register a new user account

### Request

```typescript
{
  email: string // Valid email format
  password: string // Minimum 8 characters
}
```

### Response (201 Created)

```typescript
{
  user: {
    id: string // UUID
    email: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number // Unix timestamp
  }
}
```

### Errors

- `400 Bad Request`: Invalid email format or password too short
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Server error

---

## POST /api/auth/login

Authenticate existing user

### Request

```typescript
{
  email: string
  password: string
}
```

### Response (200 OK)

```typescript
{
  user: {
    id: string
    email: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}
```

### Errors

- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

---

## POST /api/auth/logout

Log out current user

### Headers

```
Authorization: Bearer <access_token>
```

### Response (200 OK)

```typescript
{
  message: 'Logged out successfully'
}
```

### Errors

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

---

## POST /api/auth/reset-password

Request password reset email

### Request

```typescript
{
  email: string
}
```

### Response (200 OK)

```typescript
{
  message: 'Password reset email sent'
}
```

**Note**: Always returns 200 even if email doesn't exist (security best practice)

### Errors

- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Server error

---

## POST /api/auth/update-password

Update password with reset token

### Request

```typescript
{
  token: string // Reset token from email
  password: string // New password, minimum 8 characters
}
```

### Response (200 OK)

```typescript
{
  message: 'Password updated successfully'
}
```

### Errors

- `400 Bad Request`: Invalid token or password too short
- `401 Unauthorized`: Token expired or invalid
- `500 Internal Server Error`: Server error

---

## GET /api/auth/me

Get current authenticated user

### Headers

```
Authorization: Bearer <access_token>
```

### Response (200 OK)

```typescript
{
  user: {
    id: string
    email: string
    created_at: string // ISO 8601 timestamp
  }
}
```

### Errors

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error
