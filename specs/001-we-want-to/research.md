# Phase 0: Research & Technical Decisions

**Feature**: QR Code Generator with User Authentication  
**Date**: October 3, 2025

## Overview

This document captures the technical research and decisions for implementing a simple QR code generator web application with user authentication, static QR codes, and dynamic QR codes with redirects.

---

## Technical Stack Decisions

### 1. Web Framework: TanStack Start

**Decision**: Use TanStack Start as the full-stack React framework

**Rationale**:

- Modern, type-safe full-stack React framework
- Handles both frontend (React components) and backend (API routes) in a unified codebase
- Built on React Router with file-based routing
- Server-side rendering (SSR) and streaming support
- TypeScript-first design
- Active development and growing ecosystem
- Simplified deployment (single application)

**Alternatives Considered**:

- Next.js: More mature but more complex for simple projects
- Remix: Similar capabilities but TanStack Start is more modern
- Separate React + Express: More boilerplate and complexity

**Implementation Notes**:

- File-based routing in `app/routes/`
- API routes in `app/api/`
- Server functions for data fetching
- Built-in loader/action patterns for data management

---

### 2. Database & Authentication: Supabase

**Decision**: Use Supabase for both authentication and PostgreSQL database

**Rationale**:

- All-in-one platform (auth + database + storage)
- Built on PostgreSQL (reliable, scalable)
- Built-in auth with email/password, password reset
- Row Level Security (RLS) for data isolation
- Real-time subscriptions (future enhancement potential)
- Generous free tier
- TypeScript SDK with excellent DX

**Alternatives Considered**:

- Firebase: Less SQL flexibility, vendor lock-in
- Custom auth + raw PostgreSQL: More work, security concerns
- Auth0 + separate DB: More complex, higher cost

**Implementation Notes**:

- Supabase client for auth operations
- Email/password authentication
- Password reset flows handled by Supabase
- RLS policies to enforce user data isolation

---

### 3. ORM: Prisma

**Decision**: Use Prisma as the database ORM

**Rationale**:

- Type-safe database access with TypeScript
- Excellent DX with auto-completion and type inference
- Migration system for schema changes
- Works seamlessly with PostgreSQL/Supabase
- Clear, readable schema syntax
- Generated Prisma Client for queries
- Good Supabase integration

**Alternatives Considered**:

- Drizzle ORM: Newer, less mature ecosystem
- TypeORM: More complex, less type-safe
- Raw SQL: No type safety, more boilerplate

**Implementation Notes**:

- Schema defined in `prisma/schema.prisma`
- Prisma Client for all database operations
- Migrations managed via Prisma CLI
- Direct connection to Supabase PostgreSQL

---

### 4. QR Code Generation: qrcode

**Decision**: Use the `qrcode` npm package for QR code generation

**Rationale**:

- Most popular and well-maintained QR code library for Node.js
- Supports multiple output formats (PNG, SVG, data URL)
- Customizable (size, error correction, colors)
- Works on both client and server
- Zero dependencies (lightweight)
- Well-documented API

**Alternatives Considered**:

- qr-image: Less actively maintained
- node-qrcode: Older, less feature-rich
- react-qr-code: Client-only, less flexible

**Implementation Notes**:

- Generate QR codes server-side for storage
- Export as PNG for downloads
- Store as data URLs or file references in database
- Configurable size and quality settings

---

### 5. Styling: Tailwind CSS (Recommended)

**Decision**: Use Tailwind CSS for styling

**Rationale**:

- Utility-first CSS framework
- Rapid development with minimal custom CSS
- Built-in responsive design utilities
- Easy to maintain minimal, clean UI
- Excellent TanStack Start integration
- Small production bundle (tree-shaking)

**Alternatives Considered**:

- Plain CSS: More work, harder to maintain
- CSS Modules: More boilerplate
- Styled Components: Runtime overhead

**Implementation Notes**:

- Install Tailwind CSS with TanStack Start
- Configure for minimal, clean design aesthetic
- Use responsive utilities for mobile/desktop

---

## Data Model Decisions

### 6. Database Schema Design

**Decision**: Three-table structure (User, QRCode, Redirect)

**Entities**:

1. **User** (managed by Supabase Auth)
   - Leverages Supabase's built-in auth.users table
   - No need for custom user table
2. **QRCode** (custom table)
   - Stores both static and dynamic QR codes
   - Contains QR image data or reference
   - Links to user via Supabase user ID
3. **Redirect** (custom table for dynamic QR codes)
   - Stores redirect mappings (shortCode → destination URL)
   - Links to QRCode for ownership
   - Allows updates without regenerating QR code

**Rationale**:

- Separates concerns (QR code vs redirect logic)
- Allows efficient redirect lookups by shortCode
- Makes it easy to update destinations independently
- Clear relationship model

---

## Security & Data Isolation

### 7. Row Level Security (RLS)

**Decision**: Implement Supabase RLS policies for data isolation

**Policies**:

- Users can only read/write their own QR codes
- Redirect lookups are public (for scanning)
- No cross-user data access

**Rationale**:

- Database-level security (defense in depth)
- Supabase best practice
- Prevents API bugs from exposing data

---

## URL Shortening Strategy

### 8. Short Code Generation

**Decision**: Use nanoid for generating short codes

**Rationale**:

- URL-safe, unique identifiers
- Configurable length (6-8 characters recommended)
- Collision-resistant
- Fast and lightweight
- No external dependencies

**Implementation**:

- Generate short codes for dynamic QR redirect URLs
- Format: `/r/[shortCode]`
- Store mapping in Redirect table

---

## Performance Considerations

### 9. QR Code Storage Strategy

**Decision**: Store QR codes as base64 data URLs in database

**Rationale**:

- Simple implementation (no file storage needed)
- Fast retrieval (single database query)
- No CDN or file hosting required
- Sufficient for small-scale app

**Alternatives Considered**:

- File system storage: More complex, deployment issues
- Supabase Storage: Overkill for small images, extra cost
- External CDN: Unnecessary complexity

**Notes**:

- QR code PNGs are small (~2-5KB)
- PostgreSQL handles small blobs efficiently
- Can migrate to file storage if scale increases

---

## Development Workflow

### 10. Environment Setup

**Required Environment Variables**:

```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
DATABASE_URL=<your-postgres-connection-string>
```

**Setup Steps**:

1. Initialize Supabase project
2. Configure Prisma with Supabase connection
3. Run Prisma migrations
4. Set up Supabase Auth settings (email templates, URLs)

---

## Open Questions & Future Considerations

### Future Enhancements (Out of Scope for MVP)

- QR code analytics (scan tracking)
- Custom QR code styling (colors, logos)
- Bulk QR code generation
- QR code templates
- API rate limiting
- Export formats (SVG, PDF)

### Performance at Scale (Not Current Concern)

- If storage becomes an issue: Migrate to Supabase Storage
- If traffic increases: Add Redis caching for redirects
- If Supabase limits hit: Consider dedicated PostgreSQL

---

## Summary

All technical decisions are finalized with no remaining `NEEDS CLARIFICATION` items:

✅ Framework: TanStack Start  
✅ Database: Supabase PostgreSQL  
✅ ORM: Prisma  
✅ Auth: Supabase Auth  
✅ QR Generation: qrcode npm package  
✅ Styling: Tailwind CSS  
✅ Short Codes: nanoid  
✅ Storage: Base64 data URLs in database  
✅ Security: Supabase RLS policies

**Status**: Ready for Phase 1 (Design & Contracts)
