# DuoSync

DuoSync synchronizes appointments between multiple people. Manage shared schedules, check availability across users, and coordinate time together.

## Purpose

DuoSync solves the problem of coordinating schedules when multiple people need to align their commitments. Instead of manually comparing calendars or asking "when are you free?", DuoSync provides a unified view of everyone's availability.

**Use cases:**
- Families coordinating activities and appointments
- Small teams managing shared schedules
- Roommates organizing household commitments
- Groups planning events around everyone's availability

## Core Capabilities

### Appointment Synchronization
Create and manage appointments for multiple users. Each user maintains their own schedule while contributing to a shared availability view.

### Availability Checking
View overlapping free time across all users. Identify when everyone is available without manual calendar comparison.

### Recurring Appointments
Support for recurring appointments with flexible repeat patterns. Manage regular commitments efficiently.

### Multi-User Management
Switch between user profiles seamlessly. Each user has an independent schedule that contributes to the shared view.

### Real-Time Updates
Push notifications alert users when appointments are created, modified, or confirmed by others.

## Architecture

### Feature-Based Organization

The codebase follows a feature-based architecture with strict separation of concerns:

```
duosync/
├── app/                    # Next.js App Router (routes, layouts, API routes)
│   ├── api/               # REST API endpoints (server-side only)
│   └── [routes]/          # Page routes (presentation layer)
├── features/               # Domain features (business logic)
│   ├── appointments/      # Appointment domain
│   │   ├── index.ts       # Barrel export (public API)
│   │   ├── services/      # Pure business functions
│   │   └── *-context.tsx  # Feature-specific React Context
│   ├── availability/      # Availability calculation domain
│   └── users/             # User management domain
├── components/            # React UI components (presentation only)
│   ├── ui/                # Reusable design system (Radix UI)
│   └── layout/            # Layout components
├── hooks/                  # App-level hooks orchestrating features
├── lib/                    # Cross-cutting utilities and services
│   ├── db/                # Database connection and schema
│   ├── i18n/              # Internationalization utilities
│   └── notifications/     # Push notification service
├── types/                  # Global TypeScript type definitions
└── i18n/                   # Translation files (JSON)
```

### Design Principles

**Separation of Concerns**
- `app/`: Only Next.js entrypoints, no business logic
- `components/`: Presentational components receiving data via props/hooks
- `features/`: Domain logic in pure service functions, no UI dependencies
- `lib/`: Generic utilities with no component dependencies

**Service Layer Pattern**
Business logic is implemented as pure functions in `features/*/services/`:
- No side effects (except database operations)
- No UI dependencies
- Testable in isolation
- Reusable across client and server

**Barrel Exports**
Each feature exposes a public API through `index.ts`, preventing direct imports of internal implementation details. This enforces encapsulation and makes refactoring safer.

**Type Safety**
All domain types are centralized in `types/` and imported via `@/types` alias. TypeScript strict mode ensures compile-time safety across the application.

### State Management

**React Context Pattern**
Feature-specific state is managed through React Context providers:
- `AppointmentsProvider`: Manages appointments state, fetching, and mutations
- `UsersProvider`: Handles user list and active user selection
- `I18nProvider`: Manages locale and translations

**Custom Hooks**
Public API for each feature is exposed through custom hooks (`useAppointments`, `useUsers`, `useI18n`). Components never access context directly, ensuring consistent usage patterns.

**State Isolation**
Each feature's state is isolated. Context providers are keyed by user ID where appropriate, automatically resetting state when switching users.

**Local Persistence**
User preferences (active user, locale) are persisted in `localStorage` with proper SSR handling.

## Technology Stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Radix UI  
**Backend:** PostgreSQL 16, Drizzle ORM, Node.js 20  
**Infrastructure:** Docker Compose, Web Push API

Key choices:
- **Drizzle ORM**: Type-safe queries with SQL-like syntax, zero runtime overhead
- **Radix UI**: Accessible headless components, full keyboard/ARIA support
- **Next.js App Router**: Server Components for performance, API routes for backend
- **Feature-based architecture**: Domain logic isolated from presentation, testable services

## Database Design

**Schema-First Approach**
Database schema defined in `lib/db/schema.ts` using Drizzle ORM. Migrations generated automatically via `drizzle-kit push`.

**Key Tables**
- `users`: User profiles with names and metadata
- `appointments`: One-time appointments with date, time, duration
- `recurring_appointments`: Recurring appointment templates with repeat patterns
- `app_settings`: Global application configuration (admin PIN, initialization state)
- `notification_subscriptions`: Web Push subscription storage

**Connection Pooling**
PostgreSQL connection pool configured via `pg` library, reused across all database operations.

## API Design

**RESTful Endpoints**
- `GET /api/appointments`: Fetch appointments for a user
- `GET /api/appointments/batch`: Batch fetch for multiple users (optimized)
- `GET /api/appointments/recurring`: Fetch recurring templates
- `POST /api/appointments`: Create appointment
- `PUT /api/appointments/:id`: Update appointment
- `DELETE /api/appointments/:id`: Delete appointment

**Server/Client Separation**
API routes (`app/api/*`) use server-side database services. Client components use API endpoints, never direct database access. Type safety maintained through shared TypeScript types.

**Documentation**
Postman collection in `/api-docs` documents all endpoints with request/response examples.

## Additional Features

**Internationalization:** JSON-based translations (English, Italian) with client-side locale detection and template variable interpolation.

**Progressive Web App:** Custom service worker for offline caching and push notifications. Web app manifest for installable PWA experience.

**Development:** Docker Compose setup with zero-configuration. Files kept under ~200 lines with pure service functions. Strict TypeScript with no `any` types.

---

**Status**: Under active development. For updates, visit [blog.vitoesposito.it](https://blog.vitoesposito.it).
