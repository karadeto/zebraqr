# QR Code API Contracts

**Base Path**: `/api/qr`

All endpoints require authentication via `Authorization: Bearer <access_token>` header.

**Design Note**: All QR codes are dynamic with changeable destinations for simplicity.

---

## POST /api/qr/create

Create a new QR code (all QR codes are dynamic)

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request

```typescript
{
  title?: string // Optional, max 255 chars
  destinationUrl: string // Required, valid URL, max 2048 chars
}
```

### Response (201 Created)

```typescript
{
  id: string // UUID
  userId: string // UUID
  title: string | null
  shortCode: string // e.g., "abc123"
  redirectUrl: string // Full redirect URL, e.g., "https://yourapp.com/r/abc123"
  destinationUrl: string // Where the QR code redirects to
  qrImageData: string // Base64 data URL
  isActive: boolean
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}
```

### Errors

- `400 Bad Request`: Invalid input (missing fields, invalid URL, destination too long)
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: QR generation failed or server error

---

## GET /api/qr/list

List all QR codes for authenticated user

### Headers

```
Authorization: Bearer <access_token>
```

### Query Parameters

```typescript
{
  page?: number // Default: 1
  limit?: number // Default: 20, max: 100
}
```

### Response (200 OK)

```typescript
{
  qrCodes: Array<{
    id: string
    userId: string
    title: string | null
    shortCode: string
    redirectUrl: string
    destinationUrl: string
    qrImageData: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### Errors

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

---

## GET /api/qr/:id

Get a specific QR code by ID

### Headers

```
Authorization: Bearer <access_token>
```

### Path Parameters

- `id`: QR code UUID

### Response (200 OK)

```typescript
{
  id: string
  userId: string
  title: string | null
  shortCode: string
  redirectUrl: string
  destinationUrl: string
  qrImageData: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### Errors

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: QR code belongs to another user
- `404 Not Found`: QR code not found
- `500 Internal Server Error`: Server error

---

## PATCH /api/qr/:id

Update destination URL for a QR code

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

- `id`: QR code UUID

### Request

```typescript
{
  destinationUrl: string // New destination URL
}
```

### Response (200 OK)

```typescript
{
  id: string
  userId: string
  title: string | null
  shortCode: string
  redirectUrl: string
  destinationUrl: string // Updated URL
  qrImageData: string
  isActive: boolean
  updatedAt: string // ISO 8601
}
```

### Errors

- `400 Bad Request`: Invalid URL format or missing destinationUrl
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: QR code belongs to another user
- `404 Not Found`: QR code not found
- `500 Internal Server Error`: Server error

---

## DELETE /api/qr/:id

Delete a QR code (deactivates the redirect)

### Headers

```
Authorization: Bearer <access_token>
```

### Path Parameters

- `id`: QR code UUID

### Response (200 OK)

```typescript
{
  message: 'QR code deleted successfully'
  id: string
}
```

### Errors

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: QR code belongs to another user
- `404 Not Found`: QR code not found
- `500 Internal Server Error`: Server error

---

## GET /api/qr/:id/download

Download QR code as PNG file

### Headers

```
Authorization: Bearer <access_token>
```

### Path Parameters

- `id`: QR code UUID

### Response (200 OK)

```
Content-Type: image/png
Content-Disposition: attachment; filename="qrcode-{id}.png"

[Binary PNG data]
```

### Errors

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: QR code belongs to another user
- `404 Not Found`: QR code not found
- `500 Internal Server Error`: Server error
