# Quickstart Guide

**Feature**: QR Code Generator with User Authentication  
**Purpose**: Step-by-step guide to set up, run, and validate the application

---

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- Git
- A code editor

---

## 1. Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - Project name: `qr-code-generator`
   - Database password: (generate and save securely)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)

### Get Connection Details

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)
3. Go to **Settings** → **Database**
4. Copy **Connection string** → **URI** (the PostgreSQL connection string)
   - Format: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

### Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Go to **Authentication** → **Email Templates**
4. Customize email templates (optional)
5. Go to **Authentication** → **URL Configuration**
6. Set Site URL: `http://localhost:3000` (for development)

---

## 2. Project Setup

### Clone and Install

```bash
cd /Users/karadeto/DevProjects/qr-code-app

# Install dependencies
npm install

# Install additional dependencies
npm install @supabase/supabase-js @prisma/client prisma qrcode nanoid
npm install -D @types/qrcode
```

### Environment Variables

Create `.env` file in project root:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

**Important**: Add `.env` to `.gitignore`

---

## 3. Database Setup

### Initialize Prisma

```bash
# Generate Prisma client from schema
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# This will:
# 1. Create qr_codes table (dynamic-only design)
# 2. Generate Prisma Client
```

### Enable Row Level Security (RLS)

Run this SQL in Supabase SQL Editor (**SQL Editor** in sidebar):

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

-- Public can view active QR codes for redirect lookups
CREATE POLICY "Public can view active QR redirect lookups"
  ON qr_codes FOR SELECT
  USING (is_active = true);
```

### Verify Tables

In Supabase dashboard, go to **Table Editor**. You should see:

- `qr_codes` table

---

## 4. Run Development Server

```bash
npm run dev
```

The app should start at `http://localhost:3000`

---

## 5. Validation Scenarios

Note: The app uses a simplified, dynamic-only design. Any references to choosing between “Static” and “Dynamic” can be ignored — all created QR codes are dynamic and include a redirect URL (e.g., `/r/abc123`).

### Scenario 1: User Registration & Authentication

**Test Case**: New user can register and log in

**Steps**:

1. Open browser to `http://localhost:3000`
2. Click "Register" or "Sign Up"
3. Enter email: `test@example.com`
4. Enter password: `testpass123` (min 8 characters)
5. Click "Register"

**Expected Result**:

- ✅ Account created successfully
- ✅ Automatically logged in
- ✅ Redirected to dashboard
- ✅ See empty state (no QR codes yet)

**Verify in Supabase**:

- Go to **Authentication** → **Users**
- Confirm new user appears with email `test@example.com`

---

### Scenario 2: Create Static QR Code

**Test Case**: User can create a static QR code with a URL

**Prerequisites**: Logged in from Scenario 1

**Steps**:

1. From dashboard, click "Create QR Code"
2. Select type: **Static**
3. Enter title (optional): `My Website`
4. Enter content: `https://example.com`
5. Click "Generate QR Code"

**Expected Result**:

- ✅ QR code generated and displayed
- ✅ Can see QR code image
- ✅ Can see title and URL
- ✅ Type shows "Static"
- ✅ QR code appears in dashboard list

**Verify**:

- Scan QR code with phone camera
- Should open `https://example.com` directly

**Verify in Supabase**:

- Go to **Table Editor** → **qr_codes**
- Confirm new row with `type = 'STATIC'` and your content

---

### Scenario 3: Create Dynamic QR Code

**Test Case**: User can create a dynamic QR code with redirect

**Prerequisites**: Logged in

**Steps**:

1. From dashboard, click "Create QR Code"
2. Select type: **Dynamic**
3. Enter title (optional): `Promo Link`
4. Enter destination URL: `https://example.com/promo`
5. Click "Generate QR Code"

**Expected Result**:

- ✅ QR code generated
- ✅ Shows redirect URL (e.g., `https://yourapp.com/r/abc123`)
- ✅ Shows current destination
- ✅ Type shows "Dynamic"
- ✅ Can see "Edit Destination" button

**Verify**:

- Copy the redirect URL (e.g., `http://localhost:3000/r/abc123`)
- Open in browser
- Should redirect to `https://example.com/promo`

**Verify in Supabase**:

- Go to **Table Editor** → **qr_codes**: confirm `type = 'DYNAMIC'`
- Go to **Table Editor** → **redirects**: confirm redirect entry with short code

---

### Scenario 4: Update Dynamic QR Code Destination

**Test Case**: User can change where a dynamic QR code redirects

**Prerequisites**: Dynamic QR code from Scenario 3

**Steps**:

1. From dashboard, find the dynamic QR code
2. Click "Edit" or "Edit Destination"
3. Change destination URL to: `https://example.com/sale`
4. Click "Update"

**Expected Result**:

- ✅ Update successful message
- ✅ Destination URL updated in UI
- ✅ QR code image unchanged

**Verify**:

- Use same redirect URL from before
- Open in browser
- Should now redirect to `https://example.com/sale` (new destination)
- QR code itself (if scanned) still works with new destination

---

### Scenario 5: Download QR Code

**Test Case**: User can download QR code as PNG

**Prerequisites**: Any QR code created

**Steps**:

1. From dashboard, find any QR code
2. Click "Download" button
3. Save file

**Expected Result**:

- ✅ PNG file downloads
- ✅ Filename format: `qrcode-{id}.png`
- ✅ Image opens successfully
- ✅ QR code is scannable

---

### Scenario 6: Delete QR Code

**Test Case**: User can delete their QR code

**Prerequisites**: Any QR code created

**Steps**:

1. From dashboard, find a QR code
2. Click "Delete" button
3. Confirm deletion in modal/prompt

**Expected Result**:

- ✅ QR code removed from list
- ✅ Success message shown
- ✅ If dynamic: redirect URL becomes inactive

**Verify**:

- Try accessing redirect URL
- Should show 404 error page
- Check Supabase **Table Editor**: row removed from `qr_codes`

---

### Scenario 7: User Data Isolation

**Test Case**: Users can only see their own QR codes

**Prerequisites**: Complete Scenarios 1-3 with first user

**Steps**:

1. Log out
2. Register a second user: `test2@example.com`
3. Log in with second user
4. View dashboard

**Expected Result**:

- ✅ Dashboard is empty
- ✅ Cannot see first user's QR codes
- ✅ Second user can create their own QR codes

**Verify Security**:

- Try to access first user's QR code ID via URL manipulation
- Should get 403 Forbidden or redirect

---

### Scenario 8: Password Reset

**Test Case**: User can reset forgotten password

**Prerequisites**: Registered user account

**Steps**:

1. Log out
2. Click "Forgot Password"
3. Enter email: `test@example.com`
4. Submit

**Expected Result**:

- ✅ Shows confirmation that if the email exists, reset instructions were sent
- ✅ Email received with reset link (check inbox/spam)

**Continue**:

5. Click the reset link in the email (should land on `/reset-password`)
6. Enter new password: `newpass123`
7. Submit

**Expected Result**:

- ✅ Password updated successfully
- ✅ Can log in with new password

---

### Scenario 9: Error Handling

**Test Case**: System handles errors gracefully

**Test Invalid Registration**:

1. Try to register with invalid email: `notanemail`
   - ✅ Shows error: "Invalid email format"
2. Try password too short: `pass`
   - ✅ Shows error: "Password must be at least 8 characters"

**Test Invalid Login**:

1. Try wrong password
   - ✅ Shows error: "Invalid credentials"

**Test Invalid QR Creation**:

1. Try to create a QR with an invalid URL (e.g., `not-a-url`)
   - ✅ Shows error: "Invalid destination URL"
2. Try empty destination URL
   - ✅ Shows error: "Enter a valid URL (http or https)."

**Test Invalid Redirect Update**:

1. Try to update dynamic QR with invalid URL: `not-a-url`
   - ✅ Shows error: "Invalid URL format"

---

## 6. Performance Validation

### QR Code Generation Speed

**Test**: Create a QR code and measure time

**Expected**:

- ✅ Generation completes within 3 seconds
- ✅ UI remains responsive during generation

### Redirect Performance

**Test**: Access redirect URL multiple times

**Expected**:

- ✅ Redirect happens within 100ms
- ✅ No noticeable delay

---

## 7. UI/UX Validation

### Responsive Design

**Test on Multiple Devices**:

1. Desktop browser (1920x1080)
2. Tablet (iPad size)
3. Mobile (iPhone size)

**Expected**:

- ✅ Layout adapts to screen size
- ✅ All buttons/inputs accessible
- ✅ QR codes display properly
- ✅ Forms are usable on mobile

### Minimal Design

**Visual Check**:

- ✅ Clean, uncluttered interface
- ✅ Clear visual hierarchy
- ✅ Consistent spacing and typography
- ✅ Intuitive navigation
- ✅ No unnecessary elements

---

## 8. Troubleshooting

### Common Issues

**"Cannot connect to database"**

- Check `.env` file has correct `DATABASE_URL`
- Verify Supabase project is active
- Check internet connection

**"Unauthorized" errors**

- Check `SUPABASE_ANON_KEY` is correct
- Verify RLS policies are created
- Try logging out and back in

**QR codes not generating**

- Check `qrcode` package is installed
- Check console for errors
- Verify Prisma client is generated

**Redirects not working**

- Check `redirects` table has entries
- Verify `is_active = true`
- Check RLS policy allows public SELECT

---

## Summary Checklist

After completing all scenarios, you should have:

- ✅ Working authentication (register, login, logout, password reset)
- ✅ Static QR code creation and display
- ✅ Dynamic QR code creation with redirects
- ✅ Ability to update dynamic QR destinations
- ✅ QR code download functionality
- ✅ QR code deletion with cascade
- ✅ User data isolation (RLS working)
- ✅ Error handling for invalid inputs
- ✅ Responsive UI on multiple devices
- ✅ Performance within acceptable limits

**Status**: ✅ Application fully validated and ready for use
