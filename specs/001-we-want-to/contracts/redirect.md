# Redirect API Contract

**Base Path**: `/r`

Public endpoint for QR code redirects (no authentication required).

---

## GET /r/:shortCode

Redirect to destination URL for a dynamic QR code

### Path Parameters

- `shortCode`: 6-8 character alphanumeric short code

### Response (302 Found)

Redirects to the destination URL with HTTP 302 status.

```
HTTP/1.1 302 Found
Location: <destination_url>
```

### Response (404 Not Found)

When short code doesn't exist or redirect is inactive:

```typescript
{
  error: 'Not Found'
  message: 'This QR code is no longer active or does not exist'
}
```

### HTML Error Page (404)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>QR Code Not Found</title>
  </head>
  <body>
    <h1>QR Code Not Found</h1>
    <p>This QR code is no longer active or does not exist.</p>
    <a href="/">Return to Home</a>
  </body>
</html>
```

### Errors

- `404 Not Found`: Short code doesn't exist or redirect is inactive
- `500 Internal Server Error`: Server error

### Performance Notes

- This endpoint must be highly optimized (target: <50ms response time)
- Uses indexed lookup on `short_code` field
- Consider caching frequently accessed redirects (future optimization)
- No authentication check for public access

### Security Notes

- Rate limiting recommended to prevent abuse
- Log redirect attempts for analytics (future feature)
- Validate destination URL format before redirect
- Use HTTP 302 (temporary redirect) not 301 (permanent)

---

## Example Flow

1. User scans QR code with content: `https://yourapp.com/r/abc123`
2. Browser makes GET request to `/r/abc123`
3. Server looks up `abc123` in redirects table
4. If found and active: 302 redirect to destination URL
5. If not found or inactive: 404 error page
