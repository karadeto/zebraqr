# Implementation Plan: QR Code Generator with User Authentication

**Branch**: `001-we-want-to` | **Date**: October 3, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-we-want-to/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

A minimal QR code generator web application with user authentication. Users can create accounts, generate QR codes with changeable redirect URLs (all QR codes are dynamic for simplicity), manage their QR codes, and download them as PNG images. The application uses Supabase for authentication and database storage, with a clean and simple UI.

## Technical Context

**Language/Version**: TypeScript (Node.js)  
**Primary Dependencies**: TanStack Start (full-stack React framework), Supabase (auth & database), Prisma (ORM), QR code generation library  
**Storage**: Supabase PostgreSQL database  
**Testing**: None (per project requirements - keeping it simple)  
**Target Platform**: Web (browser), deployed as full-stack app  
**Project Type**: Web application (TanStack Start handles both frontend and backend)  
**Performance Goals**: QR code generation within 3 seconds, responsive UI  
**Constraints**: Simple and minimal design, mobile and desktop responsive  
**Scale/Scope**: Small-scale application, personal/small business use

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Status**: ✅ PASS

**Simplicity Principle**: Project follows KISS principle with:

- Single web application structure (TanStack Start handles both frontend/backend)
- Minimal dependencies (Supabase, Prisma, QR library)
- No complex abstractions or patterns
- Direct database access via Prisma ORM
- No testing infrastructure (per project requirements)

**No Violations**: Project structure is straightforward with no unnecessary complexity.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
app/
├── routes/
│   ├── __root.tsx              # Root layout with auth provider
│   ├── index.tsx               # Landing/login page
│   ├── register.tsx            # Registration page
│   ├── dashboard.tsx           # User dashboard (protected)
│   ├── qr/
│   │   ├── create.tsx          # Create QR code page
│   │   └── [id].tsx            # QR code detail/edit page
│   └── r/
│       └── [shortCode].tsx     # Dynamic redirect handler
├── components/
│   ├── Header.tsx              # App header with nav
│   ├── QRCodeCard.tsx          # Display QR code item
│   ├── QRCodeForm.tsx          # Create/edit form
│   └── AuthForm.tsx            # Login/register forms
├── lib/
│   ├── supabase.ts             # Supabase client setup
│   ├── prisma.ts               # Prisma client setup
│   └── qr.ts                   # QR code generation utilities
└── api/
    ├── qr/
    │   ├── create.ts           # Create QR code endpoint
    │   ├── update.ts           # Update dynamic QR destination
    │   ├── delete.ts           # Delete QR code endpoint
    │   └── list.ts             # List user's QR codes
    └── redirect/
        └── [shortCode].ts      # Redirect lookup endpoint

prisma/
├── schema.prisma               # Prisma schema definition
└── migrations/                 # Database migrations

public/
└── (static assets)
```

**Structure Decision**: TanStack Start full-stack structure. The framework handles both frontend (React components in routes/) and backend (API routes in api/). All code lives in the app/ directory following TanStack Start conventions. Prisma schema and migrations are in the prisma/ directory.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh cursor`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

The `/tasks` command will generate implementation tasks in the following order:

### 1. Foundation Setup (Tasks 1-5)

- Initialize Prisma schema with data model
- Set up Supabase client configuration
- Configure environment variables
- Run database migrations
- Apply RLS policies

### 2. Data Layer (Tasks 6-8)

- Implement Prisma schema (QRCode, Redirect models)
- Create database utility functions
- Set up Prisma Client singleton

### 3. Core Utilities (Tasks 9-11)

- Implement QR code generation utility (`lib/qr.ts`)
- Implement short code generation utility (nanoid)
- Create authentication helper functions

### 4. API Routes - Authentication (Tasks 12-17)

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/reset-password
- POST /api/auth/update-password
- GET /api/auth/me

### 5. API Routes - QR Code CRUD (Tasks 18-23)

- POST /api/qr/create (static & dynamic)
- GET /api/qr/list (with pagination)
- GET /api/qr/:id
- PATCH /api/qr/:id/redirect (update destination)
- DELETE /api/qr/:id
- GET /api/qr/:id/download

### 6. Public Redirect Route (Task 24)

- GET /r/:shortCode (public redirect handler)

### 7. UI Components (Tasks 25-31)

- Header component with navigation
- AuthForm component (login/register)
- QRCodeForm component (create/edit)
- QRCodeCard component (display QR in list)
- QRCodeDetail component (full view)
- Error boundary component
- Loading states component

### 8. Pages/Routes (Tasks 32-38)

- Root layout (\_\_root.tsx) with auth provider
- Landing/Login page (index.tsx)
- Registration page (register.tsx)
- Dashboard page (dashboard.tsx) - protected
- Create QR page (qr/create.tsx) - protected
- QR detail/edit page (qr/[id].tsx) - protected
- Redirect handler page (r/[shortCode].tsx) - public

### 9. Styling (Tasks 39-40)

- Configure Tailwind CSS
- Implement minimal, clean design system

### 10. Integration & Validation (Tasks 41-43)

- Manual testing per quickstart.md scenarios
- Fix any bugs found
- Performance validation

**Dependency Order**:

- Foundation → Data Layer → Utilities → API Routes → UI Components → Pages
- Within each group, tasks can be executed in parallel where dependencies allow

**Estimated Output**: 40-45 numbered, ordered tasks in tasks.md

**Testing Strategy**:

- No automated tests per project requirements
- Manual validation using quickstart.md scenarios
- Focus on working software over test coverage

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - 43 implementation tasks
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none - no violations)

**Artifacts Generated**:

- [x] research.md - Technical decisions and stack research
- [x] data-model.md - Database schema and entity relationships
- [x] contracts/ - API endpoint specifications
  - [x] auth.md - Authentication endpoints
  - [x] qr-codes.md - QR code CRUD endpoints
  - [x] redirect.md - Public redirect endpoint
- [x] quickstart.md - Setup guide and validation scenarios
- [x] tasks.md - 43 implementation tasks with dependencies
- [x] .cursor/rules/specify-rules.mdc - Cursor IDE context

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
