# Data Model

**Feature**: QR Code Generator with User Authentication  
**Database**: Supabase PostgreSQL via Prisma

**Design Decision**: All QR codes are dynamic with changeable destinations for simplicity and flexibility.

---

## Entity Relationship Overview

```
┌─────────────────┐
│  Supabase Auth  │
│   auth.users    │  (Managed by Supabase)
└────────┬────────┘
         │
         │ user_id (FK)
         │
         ▼
┌─────────────────┐
│     QRCode      │
│  (qr_codes)     │
│  All dynamic    │
└─────────────────┘
```

---

## Entities

### 1. User (Supabase Auth)

**Table**: `auth.users` (managed by Supabase)

**Description**: User authentication and profile information

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key (Supabase auth user ID) |
| email | String | User's email address |
| encrypted_password | String | Hashed password (managed by Supabase) |
| email_confirmed_at | Timestamp | Email verification timestamp |
| created_at | Timestamp | Account creation timestamp |
| updated_at | Timestamp | Last update timestamp |

**Notes**:

- Managed entirely by Supabase Auth
- No custom user table needed
- Referenced by QRCode table via user_id

---

### 2. QRCode

**Table**: `qr_codes`

**Description**: Stores all QR codes as dynamic redirects with changeable destinations

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | Primary key |
| user_id | UUID | Yes | - | FK to auth.users (owner) |
| title | String | No | null | Optional user-provided name |
| short_code | String | Yes | - | Unique 6-8 character URL-safe identifier |
| destination_url | Text | Yes | - | Current redirect destination |
| qr_image_data | Text | Yes | - | Base64 encoded PNG data URL |
| is_active | Boolean | Yes | true | Whether redirect is active |
| created_at | Timestamp | Yes | now() | Creation timestamp |
| updated_at | Timestamp | Yes | now() | Last modification timestamp |

**Indexes**:

- Primary: `id`
- Unique: `short_code` (for fast redirect lookups)
- Foreign key: `user_id` → `auth.users.id`
- Index on: `user_id, created_at DESC` (for user's QR list)
- Index on: `short_code` (for public redirect lookups)

**Validation Rules**:

- `short_code` must be unique, 6-8 alphanumeric URL-safe characters
- `destination_url` must be valid URL format (http:// or https://)
- `destination_url` max length: 2048 characters
- `qr_image_data` must be valid data URL format
- `title` max length: 255 characters

**Relationships**:

- Belongs to: User (via `user_id`)
- No additional relationships (simplified from previous two-model design)

**RLS Policies** (Supabase):

```sql
-- Enable RLS on qr_codes table
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Users can view only their own QR codes
CREATE POLICY "Users can view own QR codes"
  ON qr_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own QR codes
CREATE POLICY "Users can create QR codes"
  ON qr_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own QR codes
CREATE POLICY "Users can update own QR codes"
  ON qr_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own QR codes
CREATE POLICY "Users can delete own QR codes"
  ON qr_codes FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active QR codes for redirect lookups (anyone can scan)
CREATE POLICY "Public can view active QR codes for redirects"
  ON qr_codes FOR SELECT
  USING (is_active = true);
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Simplified: All QR codes are dynamic with changeable destinations
model QRCode {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  title         String?  @db.VarChar(255)
  shortCode     String   @unique @map("short_code") @db.VarChar(8)
  destinationUrl String  @map("destination_url") @db.Text
  qrImageData   String   @map("qr_image_data") @db.Text
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([userId, createdAt(sort: Desc)])
  @@index([shortCode])
  @@map("qr_codes")
}
```

---

## State Transitions

### QR Code Lifecycle

```
┌─────────────┐
│   CREATED   │
│  (new QR)   │
│  ACTIVE     │
└──────┬──────┘
       │
       ├──→ User can update destination_url anytime
       │    └─→ QR code image stays the same
       │
       ├──→ User can deactivate (is_active = false)
       │    └─→ Redirect stops working
       │
       ├──→ User can reactivate (is_active = true)
       │    └─→ Redirect works again
       │
       └──→ User deletes QR code
            └─→ Permanently removed, redirect stops
```

---

## Data Integrity Rules

1. **User Ownership**:
   - Every QRCode must have a valid user_id
   - Enforced by foreign key constraint
   - Protected by RLS policies

2. **Unique Short Codes**:
   - Each short_code must be globally unique
   - Enforced by unique constraint
   - Generated using nanoid to avoid collisions

3. **Valid Destination URLs**:
   - All destination_url values must be valid HTTP/HTTPS URLs
   - Enforced by application validation
   - Max length: 2048 characters

4. **Active State**:
   - Only active QR codes (is_active = true) are publicly accessible for redirects
   - Deactivated QR codes return 404 when scanned
   - Enforced by RLS policy and application logic

5. **QR Image Integrity**:
   - qr_image_data must be valid base64 PNG data URL
   - Generated once at creation, never changed
   - Even when destination_url is updated, QR image stays the same

---

## Query Patterns

### Common Queries

1. **List user's QR codes** (paginated):

```typescript
await prisma.qrCode.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: offset,
})
```

2. **Get specific QR code**:

```typescript
await prisma.qrCode.findUnique({
  where: { id: qrCodeId },
})
```

3. **Lookup QR code by short code for redirect**:

```typescript
await prisma.qrCode.findUnique({
  where: {
    shortCode,
    isActive: true,
  },
})
```

4. **Create QR code**:

```typescript
await prisma.qrCode.create({
  data: {
    userId,
    title,
    shortCode,
    destinationUrl,
    qrImageData,
  },
})
```

5. **Update QR code destination**:

```typescript
await prisma.qrCode.update({
  where: { id: qrCodeId },
  data: { destinationUrl: newUrl },
})
```

6. **Toggle QR code active state**:

```typescript
await prisma.qrCode.update({
  where: { id: qrCodeId },
  data: { isActive: !currentState },
})
```

7. **Delete QR code**:

```typescript
await prisma.qrCode.delete({
  where: { id: qrCodeId },
})
```

---

## Performance Considerations

1. **Indexes**:
   - `user_id, created_at` for efficient user QR list queries
   - `short_code` unique index for O(1) redirect lookups
   - UUID primary keys for global uniqueness

2. **Data Size**:
   - QR image data URLs: ~2-5KB each
   - Acceptable for PostgreSQL storage
   - Monitor if volume exceeds 100K QR codes

3. **Redirect Lookups**:
   - Unique index on short_code ensures O(1) lookups
   - Critical for redirect performance (<50ms target)
   - Consider Redis caching if traffic is high

4. **Simplified Schema Benefits**:
   - Single table reduces join overhead
   - Faster queries (no join to redirects table)
   - Simpler application logic

---

## Summary

✅ **2 Entities**: User (Supabase Auth), QRCode  
✅ **Clear Relationships**: One-to-many (User → QRCode)  
✅ **Simplified Design**: All QR codes are dynamic, no type distinction  
✅ **RLS Policies**: Comprehensive data isolation + public redirect access  
✅ **Validation**: Type safety + business rules  
✅ **Prisma Schema**: Single model, ready for migration  
✅ **Query Patterns**: Optimized for common operations

**Key Simplifications**:

- Eliminated QRCodeType enum
- Merged Redirect into QRCode (single table)
- Removed static/dynamic distinction
- Simpler API contracts and UI

**Status**: Ready for implementation
