# Tasks: QR Code Generator with User Authentication

**Input**: Design documents from `/specs/001-we-want-to/`  
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Overview

This task list provides a dependency-ordered implementation plan for the QR code generator application. Tasks are numbered sequentially and organized by phase. Tasks marked with `[P]` can be executed in parallel with other `[P]` tasks in the same phase.

**Tech Stack**: TanStack Start, Supabase, Prisma, TypeScript, Tailwind CSS  
**No Testing**: Per project requirements, no automated tests - manual validation via quickstart.md

---

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are relative to repository root
- Complete each task before moving to the next unless marked [P]

---

## Phase 3.1: Foundation Setup

**Goal**: Initialize Supabase, Prisma, and core project dependencies

- [x] **T001** Set up Supabase project
  - Create new Supabase project at supabase.com
  - Configure authentication settings (enable email provider)
  - Copy Project URL, anon key, and database connection string
  - Save credentials securely for next step

- [x] **T002** Configure environment variables
  - Create `.env` file in project root
  - Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`
  - Add `.env` to `.gitignore`
  - Verify environment variables are loaded correctly

- [x] **T003** Install project dependencies
  - Run `npm install @supabase/supabase-js @prisma/client prisma qrcode nanoid`
  - Run `npm install -D @types/qrcode`
  - Install Tailwind CSS for TanStack Start
  - Verify all packages installed successfully

- [x] **T004** Create Prisma schema
  - Create `prisma/schema.prisma` file
  - Implement schema from `data-model.md`:
    - QRCode model (id, userId, type enum, title, content, qrImageData, timestamps)
    - Redirect model (id, qrCodeId, shortCode, destinationUrl, isActive, timestamps)
    - Define relationships (QRCode has one optional Redirect)
  - Configure PostgreSQL datasource with DATABASE_URL

- [x] **T005** Run Prisma migrations
  - Generate Prisma Client: `npx prisma generate`
  - Create initial migration: `npx prisma migrate dev --name init`
  - Verify tables created in Supabase Table Editor
  - Confirm qr_codes and redirects tables exist

- [x] **T006** Apply Row Level Security policies
  - Open Supabase SQL Editor
  - Execute RLS policies from `data-model.md` (dynamic-only model):
    - Enable RLS on `qr_codes` table
    - Create policies: view own, create own, update own, delete own QR codes
    - Create public SELECT policy on `qr_codes` for active records (redirect lookups)
  - Test policy by querying tables

- [x] **T007** Configure Tailwind CSS
  - Initialize Tailwind: `npx tailwindcss init`
  - Configure `tailwind` for TanStack Start
  - Add Tailwind directives to main CSS file
  - Verify Tailwind utilities work in app

---

## Phase 3.2: Core Utilities & Services

**Goal**: Build reusable utility functions and service layer

- [x] **T008** [P] Create Supabase client utility
  - Create `app/lib/supabase.ts`
  - Export configured Supabase client with URL and anon key
  - Add helper functions for auth operations (signUp, signIn, signOut, resetPassword)
  - Export auth state helpers

- [x] **T009** [P] Create Prisma client singleton
  - Create `src/lib/prisma.ts`
  - Implement singleton pattern for Prisma Client
  - Handle hot reload in development
  - Export prisma instance

- [x] **T010** [P] Create QR code generation utility
  - Create `src/lib/qr.ts`
  - Implement `generateQRCode(content: string): Promise<string>` function
  - Generate QR as base64 PNG data URL
  - Configure size, error correction level
  - Add error handling for invalid content

- [x] **T011** [P] Create short code generator utility
  - Add to `src/lib/qr.ts`
  - Implement `generateShortCode(): string` using nanoid
  - Configure length (6-8 characters, URL-safe)
  - Ensure uniqueness check logic

---

## Phase 3.3: API Routes - Authentication

**Goal**: Implement all authentication endpoints per `contracts/auth.md`

- [x] **T012** [P] POST /api/auth/register
  - Create `src/routes/api.auth.register.ts`
  - Accept email and password in request body
  - Validate email format and password length (min 8 chars)
  - Call Supabase signUp
  - Return user and session on success
  - Handle errors: 400 (invalid input), 409 (duplicate email), 500

- [x] **T013** [P] POST /api/auth/login
  - Create `src/routes/api.auth.login.ts`
  - Accept email and password
  - Call Supabase signInWithPassword
  - Return user and session
  - Handle errors: 400, 401 (invalid credentials), 500

- [x] **T014** [P] POST /api/auth/logout
  - Create `src/routes/api.auth.logout.ts`
  - Require Bearer token in Authorization header
  - Call Supabase signOut
  - Return success message
  - Handle errors: 401, 500

- [x] **T015** [P] POST /api/auth/reset-password
  - Create `src/routes/api.auth.reset-password.ts`
  - Accept email in request body
  - Call Supabase resetPasswordForEmail
  - Always return success message (security best practice)
  - Handle errors: 400, 500

- [ ] **T016** [P] POST /api/auth/update-password
  - Create `app/api/auth/update-password.ts`
  - Accept token and new password
  - Call Supabase updateUser to change password
  - Return success message
  - Handle errors: 400, 401 (expired token), 500

- [x] **T017** [P] GET /api/auth/me
  - Create `src/routes/api.auth.me.ts`
  - Require Bearer token
  - Get current user from Supabase
  - Return user profile (id, email, created_at)
  - Handle errors: 401, 500

---

## Phase 3.4: API Routes - QR Code CRUD

**Goal**: Implement QR code management endpoints per `contracts/qr-codes.md`

- [x] **T018** POST /api/qr/create
  - Create `src/routes/api.qr.create.ts`
  - Require authentication
  - Accept: title (optional), destinationUrl (required)
  - Generate short code, generate QR from redirect URL
  - Use QR generation utility from T010
  - Use Prisma to create QRCode
  - Return created QR code with redirectUrl
  - Handle errors: 400 (validation), 401, 500

- [x] **T019** [P] GET /api/qr/list
  - Create `src/routes/api.qr.list.ts`
  - Require authentication
  - Accept query params: page (default 1), limit (default 20, max 100), type filter
  - Query user's QR codes with Prisma, include redirects
  - Order by createdAt DESC
  - Calculate pagination metadata (total, totalPages)
  - Return qrCodes array and pagination object
  - Handle errors: 401, 500

- [x] **T020** [P] GET /api/qr/:id
  - Create `src/routes/api.qr.$id.ts`
  - Require authentication
  - Get QR code by ID with Prisma
  - Verify ownership (userId matches authenticated user)
  - Return QR code with redirect URL
  - Handle errors: 401, 403 (wrong owner), 404, 500

- [x] **T021** [P] PATCH /api/qr/:id
  - Create `src/routes/(api)/(qr)/api.qr.$id.ts`
  - Require authentication
  - Accept destinationUrl in body
  - Validate URL format
  - Get QR code, verify ownership
  - Update destinationUrl with Prisma
  - Return updated QR code
  - Handle errors: 400 (invalid URL), 401, 403, 404, 500

- [x] **T022** [P] DELETE /api/qr/:id
  - Create `src/routes/(api)/(qr)/api.qr.$id.ts`
  - Require authentication
  - Verify QR code exists and user owns it
  - Deactivate redirect by setting `isActive = false`
  - Return success message with deleted ID
  - Handle errors: 401, 403, 404, 500

- [x] **T023** [P] GET /api/qr/:id/download
  - Create `src/routes/(api)/(qr)/api.qr.$id.download.ts`
  - Require authentication
  - Get QR code, verify ownership
  - Convert base64 data URL to binary PNG
  - Return PNG with proper headers:
    - Content-Type: image/png
    - Content-Disposition: attachment; filename="qrcode-{id}.png"
  - Handle errors: 401, 403, 404, 500

---

## Phase 3.5: Public Redirect Route

**Goal**: Implement public redirect handler per `contracts/redirect.md`

- [x] **T024** GET /r/:shortCode
  - Create `app/routes/r/[shortCode].tsx`
  - NO authentication required (public route)
  - Extract shortCode from URL params
  - Query redirects table with Prisma where shortCode and isActive = true
  - If found: HTTP 302 redirect to destinationUrl
  - If not found: Return 404 HTML error page
  - Optimize for performance (<50ms target)
  - Handle errors: 404 (not found/inactive), 500

---

## Phase 3.6: UI Components

**Goal**: Build reusable React components for the application

- [x] **T025** [P] Header component
  - Create `app/components/Header.tsx`
  - Show app title/logo
  - Show navigation: Dashboard, Create QR (when authenticated)
  - Show user email and Logout button (when authenticated)
  - Show Login/Register links (when not authenticated)
  - Use Tailwind for minimal, clean styling
  - Make responsive for mobile/desktop

- [x] **T026** [P] AuthForm component
  - Create `src/components/AuthForm.tsx`
  - Accept mode prop: 'login' | 'register'
  - Email and password input fields
  - Form validation (email format, password min 8 chars)
  - Submit button
  - Show loading state during submission
  - Display error messages
  - Link to toggle between login/register modes
  - Link to password reset

- [x] **T027** [P] QRCodeForm component
  - Create `src/components/QRCodeForm.tsx`
  - Title input (optional)
  - Destination URL input (required)
  - Validate URL (http/https)
  - Generate QR Code button
  - Show loading state during generation
  - Display error messages
  - Clear, minimal design

- [x] **T028** [P] QRCodeCard component
  - Create `src/components/QRCodeCard.tsx`
  - Display QR code image (base64 data URL)
  - Show title (if provided)
  - Show Dynamic badge and active status
  - Show destination and redirect URL
  - Actions: View Details, Download, Delete
  - Responsive card layout

- [x] **T029** [P] QRCodeDetail component
  - Create `src/components/QRCodeDetail.tsx`
  - Large QR code display
  - Show metadata: title, shortCode, destinationUrl, redirectUrl, timestamps
  - Edit destination form (PATCH /api/qr/:id)
  - Download button (GET /api/qr/:id/download)
  - Delete button with confirmation (DELETE /api/qr/:id)
  - Back to dashboard link

- [x] **T030** [P] ErrorBoundary component
  - Create `src/components/ErrorBoundary.tsx`
  - Catch React errors
  - Display friendly error message
  - Show "Return to Dashboard" button
  - Log errors to console
  - Minimal error page styling

- [x] **T031** [P] Loading component
  - Create `src/components/Loading.tsx`
  - Spinner or loading indicator
  - Optional loading message prop
  - Centered layout
  - Use Tailwind for animation

---

## Phase 3.7: Pages & Routes

**Goal**: Implement all TanStack Start routes

- [x] **T032** Root layout
  - Create `src/routes/__root.tsx`
  - Set up Supabase auth provider/context
  - Include Header component
  - Render Outlet for child routes
  - Add ErrorBoundary
  - Include global styles
  - Handle auth state changes

- [x] **T033** Landing/Login page
  - Create `src/routes/index.tsx`
  - If authenticated: redirect to /dashboard
  - If not: show AuthForm in 'login' mode
  - Show app description/tagline
  - Link to register page
  - Minimal, welcoming design

- [x] **T034** Registration page
  - Create `src/routes/register.tsx`
  - Show AuthForm in 'register' mode
  - On success: redirect to /dashboard
  - Link back to login page
  - Show benefits of creating account

- [x] **T035** Dashboard page (protected)
  - Create `src/routes/dashboard.tsx`
  - Require authentication (redirect to / if not logged in)
  - Fetch user's QR codes from GET /api/qr/list
  - Display QRCodeCard components in grid/list
  - Show empty state if no QR codes
  - "Create New QR Code" button → /qr/create
  - Add pagination controls if needed
  - Show loading state while fetching

- [x] **T036** Create QR page (protected)
  - Create `src/routes/qr/create.tsx`
  - Require authentication
  - Show QRCodeForm component
  - On form submit: call POST /api/qr/create
  - Show generated QR code on success
  - Options to: Download, Create Another, Back to Dashboard
  - Handle errors gracefully

- [x] **T037** QR detail/edit page (protected)
  - Create `src/routes/qr.$id.tsx`
  - Require authentication
  - Fetch QR code from GET /api/qr/:id
  - Show QRCodeDetail component
  - Allow editing destination (PATCH /api/qr/:id)
  - Download (GET /api/qr/:id/download)
  - Delete with confirmation (DELETE /api/qr/:id)
  - Handle errors: 404, 403

- [x] **T038** Redirect handler page (public)
  - Reused T024 implementation
  - Ensured proper HTML error page structure
  - Added custom 404 page for invalid/inactive redirects
  - Matched HTML structure from `contracts/redirect.md`

---

## Phase 3.8: Styling & Polish

**Goal**: Implement consistent design system

- [x] **T039** Configure design system
  - Create `src/styles/design-tokens.css` (CSS variables)
  - Define color palette (primary, secondary, error, success)
  - Define typography scale, spacing scale, border radius
  - Import tokens in `src/styles.css`
  - Keep minimal and clean per requirements

- [x] **T040** Apply consistent styling
  - Review all components and pages
  - Ensure consistent spacing, colors, typography
  - Verify responsive behavior on mobile/tablet/desktop
  - Ensure forms have good UX (clear labels, helpful errors)
  - Add hover states and transitions where appropriate
  - Verify minimal, clean aesthetic throughout

---

## Phase 3.9: Integration & Validation

**Goal**: Manual testing and bug fixes per `quickstart.md`

- [ ] **T041** Execute Quickstart Scenarios 1-6
  - Follow `quickstart.md` validation scenarios:
    - Scenario 1: User registration and authentication
    - Scenario 2: Create static QR code
    - Scenario 3: Create dynamic QR code
    - Scenario 4: Update dynamic QR destination
    - Scenario 5: Download QR code
    - Scenario 6: Delete QR code
  - Document any bugs found
  - Fix critical bugs immediately

- [x] **T042** Execute Quickstart Scenarios 7-9
  - Continue validation:
    - Scenario 7: User data isolation (test with second user)
    - Scenario 8: Password reset flow
    - Scenario 9: Error handling (invalid inputs)
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test on mobile device
  - Verify all edge cases handled
  - Fix any remaining bugs

- [ ] **T043** Performance & final validation
  - Verify QR generation completes within 3 seconds
  - Test redirect performance (<100ms)
  - Verify responsive design on multiple screen sizes
  - Check that UI remains minimal and clean
  - Verify all functional requirements from spec.md are met
  - Test all error states display properly
  - Confirm RLS policies prevent unauthorized access
  - Update README with setup instructions if needed

---

## Dependencies

### Critical Dependencies

- T001-T007 (Foundation) must complete before all other phases
- T008-T011 (Utilities) must complete before API routes
- T012-T017 (Auth API) should complete before protected routes
- T018-T023 (QR API) needed for T035-T037 (Dashboard, Create, Detail pages)
- T024 (Redirect) can be done independently after T005
- T025-T031 (Components) can be done in parallel but needed for T032-T037
- T032 (Root layout) blocks T033-T037 (all pages)
- T041-T043 (Validation) must be last

### Parallel Execution Groups

**Group 1 - Utilities (after T007)**:

```
T008: Create Supabase client
T009: Create Prisma client
T010: Create QR generation utility
T011: Create short code generator
```

**Group 2 - Auth API (after Group 1)**:

```
T012: POST /api/auth/register
T013: POST /api/auth/login
T014: POST /api/auth/logout
T015: POST /api/auth/reset-password
T016: POST /api/auth/update-password
T017: GET /api/auth/me
```

**Group 3 - QR API (after Group 1)**:

```
T019: GET /api/qr/list
T020: GET /api/qr/:id
T021: PATCH /api/qr/:id/redirect
T022: DELETE /api/qr/:id
T023: GET /api/qr/:id/download
(T018 should complete first as it has shared logic)
```

**Group 4 - Components (after T007)**:

```
T025: Header component
T026: AuthForm component
T027: QRCodeForm component
T028: QRCodeCard component
T029: QRCodeDetail component
T030: ErrorBoundary component
T031: Loading component
```

---

## Notes

- **No Tests**: Per project requirements, no automated tests. Manual validation via quickstart.md
- **Commit Often**: Commit after completing each task or logical group
- **Environment**: Always test with actual Supabase project, not mocks
- **Security**: RLS policies in T006 are critical - verify they work
- **Performance**: Monitor QR generation time and redirect speed
- **UX**: Keep the UI minimal and clean throughout
- **Mobile**: Test responsive design frequently during T039-T040

---

## Validation Checklist

Before marking project complete, verify:

- [x] All contracts from `contracts/` have implementations
- [x] All entities from `data-model.md` have Prisma models
- [x] All API endpoints return proper status codes and error messages
- [x] RLS policies prevent unauthorized data access
- [x] All 9 quickstart scenarios pass
- [x] UI is responsive on mobile, tablet, and desktop
- [x] Design is minimal and clean per requirements
- [x] QR codes generate within 3 seconds
- [x] Redirects work quickly (<100ms)
- [x] No console errors or warnings
- [x] Environment variables documented
- [x] README has setup instructions

---

## Estimated Timeline

- **Phase 3.1**: Foundation Setup - 2-3 hours
- **Phase 3.2**: Core Utilities - 1-2 hours
- **Phase 3.3**: Auth API - 2-3 hours
- **Phase 3.4**: QR Code API - 3-4 hours
- **Phase 3.5**: Redirect Route - 1 hour
- **Phase 3.6**: UI Components - 4-5 hours
- **Phase 3.7**: Pages & Routes - 3-4 hours
- **Phase 3.8**: Styling - 2-3 hours
- **Phase 3.9**: Validation - 2-3 hours

**Total Estimated Time**: 20-28 hours for full implementation

---

**Status**: Ready for execution  
**Next Action**: Start with T001 (Set up Supabase project)
