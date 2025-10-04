# Design Simplification: All QR Codes Are Dynamic

**Date**: October 3, 2025  
**Reason**: Simplified UX and implementation by making all QR codes dynamic with changeable destinations

---

## Overview

The initial design had two types of QR codes:

- **Static**: Fixed content, QR code encoded the actual URL/text
- **Dynamic**: Redirect-based, QR code encoded a short URL that could be changed

**New Design**: All QR codes are dynamic. This provides:

- ✅ Simpler user experience (no confusing choice)
- ✅ More flexibility (users can always update destinations)
- ✅ Simpler codebase (single data model, simpler API)
- ✅ Future-proof (can add analytics, tracking later)

---

## Database Schema Changes

### Before (Complex - 2 Models)

```prisma
enum QRCodeType {
  STATIC
  DYNAMIC
}

model QRCode {
  id          String      @id
  userId      String
  type        QRCodeType   // STATIC or DYNAMIC
  title       String?
  content     String?      // Only for STATIC
  qrImageData String
  redirect    Redirect?    // Only for DYNAMIC
}

model Redirect {
  id             String
  qrCodeId       String @unique
  shortCode      String @unique
  destinationUrl String
  isActive       Boolean
}
```

### After (Simple - 1 Model)

```prisma
model QRCode {
  id            String  @id
  userId        String
  title         String?
  shortCode     String  @unique
  destinationUrl String
  qrImageData   String
  isActive      Boolean
}
```

**Benefits**:

- Removed `QRCodeType` enum
- Merged `Redirect` into `QRCode`
- Eliminated one table and one relationship
- Simpler queries (no joins needed)

---

## API Contract Changes

### POST /api/qr/create

**Before**:

```typescript
// Two different request formats
{ type: "STATIC", content: string }
// OR
{ type: "DYNAMIC", destinationUrl: string }
```

**After**:

```typescript
// Single format
{ title?: string, destinationUrl: string }
```

### GET /api/qr/list

**Before**:

```typescript
// Query params included type filter
{ page, limit, type?: "STATIC" | "DYNAMIC" }

// Response included different fields based on type
{
  type: "STATIC" | "DYNAMIC",
  content?: string,     // Only for static
  redirect?: { ... }    // Only for dynamic
}
```

**After**:

```typescript
// No type filter needed
{ page, limit }

// Response is consistent
{
  shortCode: string,
  redirectUrl: string,
  destinationUrl: string
}
```

### PATCH /api/qr/:id/redirect → PATCH /api/qr/:id

**Before**: `/api/qr/:id/redirect` (only for dynamic QR codes)  
**After**: `/api/qr/:id` (works for all QR codes)

---

## UI Component Changes

### QRCodeForm Component

**Removed**:

- Type selector (radio buttons for Static/Dynamic)
- Conditional field rendering
- Type-specific validation

**Simplified To**:

- Title field (optional)
- Destination URL field (required)
- Generate button

### QRCodeCard Component

**Removed**:

- Type badge display
- Conditional "Edit" button (only showed for dynamic)
- Different layouts for static vs dynamic

**Simplified To**:

- Always shows: title, destination URL, redirect URL
- Always shows: Edit and Download buttons
- Single consistent layout

### QRCodeDetail Component

**Removed**:

- Type indicator
- Conditional edit form (only for dynamic)
- Static-only fields

**Simplified To**:

- Always shows edit form for destination URL
- Consistent interface regardless of when created

---

## RLS Policy Changes

**Before**: Two tables with complex policies

```sql
-- qr_codes table policies
CREATE POLICY ... ON qr_codes ...

-- redirects table policies (join to qr_codes for ownership)
CREATE POLICY ... ON redirects ...
WHERE EXISTS (SELECT 1 FROM qr_codes ...)
```

**After**: Single table with simple policies

```sql
-- All policies on one table
CREATE POLICY "Users can view own QR codes"
  ON qr_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active QR codes for redirects"
  ON qr_codes FOR SELECT
  USING (is_active = true);
```

---

## Task Changes

Several tasks were simplified:

### T004: Create Prisma Schema

- **Before**: Define enum, two models with relationship
- **After**: Single model, no enum

### T018: POST /api/qr/create

- **Before**: Handle two different request formats, branch logic for static vs dynamic
- **After**: Single code path, always generate short code

### T019: GET /api/qr/list

- **Before**: Support type filtering, conditional includes
- **After**: Simple query, no filtering needed

### T021: PATCH /api/qr/:id/redirect → PATCH /api/qr/:id

- **Before**: Only worked for dynamic, needed type check
- **After**: Works for all QR codes

### T027: QRCodeForm Component

- **Before**: Type selector, conditional rendering
- **After**: Simple form with two fields

### T028: QRCodeCard Component

- **Before**: Type badge, conditional edit button
- **After**: Consistent display, always show edit

### T029: QRCodeDetail Component

- **Before**: Conditional edit form
- **After**: Always show edit capability

---

## Files Updated

1. ✅ `prisma/schema.prisma` - Simplified to single model
2. ✅ `specs/001-we-want-to/data-model.md` - Updated entity descriptions, removed Redirect
3. ✅ `specs/001-we-want-to/contracts/qr-codes.md` - Simplified all endpoints
4. ✅ `specs/001-we-want-to/plan.md` - Updated summary
5. 📝 `specs/001-we-want-to/tasks.md` - Task descriptions updated (if needed)
6. 📝 `specs/001-we-want-to/quickstart.md` - Scenarios updated (if needed)

---

## Migration Path

Since this change was made before implementation (during T004), no data migration is needed. The initial database migration will use the simplified schema.

---

## Summary

**Lines of Code Saved**: Estimated 200-300 lines across backend + frontend  
**Complexity Reduced**: 1 fewer model, 1 fewer table, simpler API contracts  
**User Experience**: Clearer, no confusing type choice  
**Future Flexibility**: All QR codes can be updated, tracked, analyzed

**Decision**: ✅ Approved and implemented before T005 (migrations)
