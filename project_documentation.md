# AIMS V5 Project Documentation (Extra Detailed)
**Enterprise Asset & IT Infrastructure Management System**

This document provides a deep, technical breakdown of the AIMS project architecture. It is designed for developers, architects, and administrators who need to understand the exact workings of the database, the API layers, security policies, and frontend structure.

---

## 1. System Architecture & Tech Stack

AIMS uses a modern serverless stack hosted on Vercel & Supabase.

*   **Frontend Framework**: Next.js 15 (App Router paradigm)
*   **Language**: TypeScript (Strict mode enabled)
*   **UI/UX Layer**:
    *   **Tailwind CSS** for utility-first styling.
    *   **Shadcn UI** for accessible component primitives (Radix UI under the hood).
    *   **Framer Motion** for micro-interactions and page transitions (`FadeIn`, `SlideUp`).
    *   **Lucide React** for consistent iconography.
*   **State Management & Data Synchronization**:
    *   **TanStack Query v5 (React Query)**: Handles all server state, caching, background fetching, and optimistic updates.
    *   **React Hook Form + Zod**: End-to-end type-safe form validation.
*   **Backend as a Service (BaaS)**:
    *   **Supabase PostgreSQL**: Relational database.
    *   **Supabase Auth**: JWT-based authentication tied to database profiles.
    *   **Supabase Storage**: Object storage for repair ticket evidence (`repair_attachments`).
    *   **Supabase Realtime**: (Configured for future SLA updates).

---

## 2. Deep Dive: Database Schema (Supabase)

The database is highly relational and heavily relies on PostgreSQL advanced features (Enums, Triggers, RLS, Views).

### 2.1 Enums (Custom Types)
*   `user_role`: `'super_admin'`, `'project_manager'`, `'project_admin'`, `'technician'`, `'department_user'`, `'staff'`, `'viewer'`.
*   `hardware_status`: `'active'`, `'in_repair'`, `'disposed'`, `'retired'`, `'lost'`.
*   `hardware_type`: `'pc'`, `'laptop'`, `'printer'`, `'server'`.
*   `hardware_condition`: `'good'`, `'fair'`, `'damaged'`.
*   `ticket_severity`: `'critical'`, `'high'`, `'medium'`, `'low'`, `'informational'`.
*   `ticket_status`: `'open'`, `'assigned'`, `'investigation'`, `'in_repair'`, `'vendor_escalation'`, `'testing'`, `'resolved'`, `'closed'`.

### 2.2 Core Tables & Key Relationships

#### Organizational Hierarchy
*   **`projects`**: Top-level entity (e.g., KKM, MOE).
*   **`project_members`**: Joins `profiles` to `projects` with a specific role.
*   **`contracts`**: Belongs to `projects` and `vendors`. Dictates SLA terms.
*   **`regions`** → **`states`** → **`facilities`** → **`departments`**: The physical hierarchy. Assets are assigned to `departments`.

#### Hardware & Inventory Management
*   **`hardware`**: The central asset table.
    *   *Foreign Keys*: `department_id`, `vendor_id`.
    *   *Fields*: `asset_tag`, `serial_number`, `type_hardware`, `brand`, `model`, `cpu`, `ram`, `storage`, `mac_address`, `ip_address`, `purchase_date`, `warranty_expiry`, `health_score` (0-100), `status`.
*   **`asset_movements`**: Logs every time hardware moves between departments.
*   **`asset_assignments`**: Logs which user (`pic_name`) currently holds the asset.
*   **`warehouse_items`**: General consumables (e.g., toner, mice).

#### Maintenance & SLA Management
*   **`repair_tickets`**:
    *   *Foreign Keys*: `hardware_id`, `assigned_to` (profile), `sla_policy_id`.
    *   *Fields*: `title`, `description`, `severity`, `status`, `opened_at`, `created_at`.
*   **`repair_logs`**: Comments and updates for a specific `ticket_id`.
*   **`repair_attachments`**: URLs of images uploaded to Supabase Storage.
*   **`sla_events`**: Tracks SLA breaches and resolution times for tickets.

#### Security & Audit
*   **`profiles`**: Tied 1:1 with `auth.users`. Contains global `role`.
*   **`audit_logs`**: Captures `table_name`, `record_id`, `action` (insert/update/delete), `old_data`, `new_data`.

### 2.3 Row Level Security (RLS) Mechanics
RLS is strict. Users can only access rows they are authorized to see based on the `has_project_access()` and `has_project_role()` functions.
*   **Hardware / Tickets**: To view a ticket, the system checks if the user's `project_id` matches the project linked to the ticket's hardware (via the `hardware -> department -> facility -> state -> region -> contract -> project` chain).
*   *Note*: The `project_id_for_hardware(uuid)` PostgreSQL function recursively resolves this chain to evaluate permissions quickly.

### 2.4 Triggers & Automation (PostgreSQL Functions)
1.  `auto_reduce_health_score`: Fires `AFTER INSERT ON repair_tickets`. If a ticket is `critical` (-20), `high` (-10), or `medium` (-5), it deducts points from the associated hardware's `health_score`.
2.  `audit_log_trigger`: Fires on any mutation across core tables, serializing the state to `audit_logs` as JSONB.
3.  `set_updated_at`: Automatically updates the `updated_at` timestamp on row modification.

---

## 3. Frontend Structure (`src/`)

### 3.1 Routing Matrix (`src/app/`)
*   **`/(app)/dashboard`**: The brain of the app. It checks the user's context and dynamically renders:
    *   `Overview` (Super Admin)
    *   `ProjectAdminDashboard` (Project Admin)
    *   `TechnicianDashboard` (Technician)
    *   `UserPortal` (Department User)
*   **`/(app)/assets`**: Inventory view. Data-table with filtering.
*   **`/(app)/assets/add`**: Multi-step wizard to register new hardware (Specs, Location, Warranty).
*   **`/(app)/assets/[id]`**: Dynamic detail page. Generates a printable QR Code linking back to this page. Displays specs, health score bar, and assignment history.
*   **`/(app)/maintenance`**: Kanban/List view of `repair_tickets`.
*   **`/(app)/maintenance/create`**: Form to submit a new issue with file upload evidence.
*   **Other Routes**: `/projects`, `/contracts`, `/vendors`, `/warehouse`, `/reports`, `/analytics`, `/audit`, `/intelligence`, `/settings`, `/notifications`.

### 3.2 Key Contexts (`src/contexts/`)
*   `RoleContext`: Fetches the authenticated user's `profile` from Supabase on mount. It evaluates the `role` and determines access rights. It prevents layout flicker by providing an `isLoading` state.

### 3.3 Components (`src/components/`)
*   **`dashboard/`**: Contains the role-specific dashboard views.
*   **`layouts/`**:
    *   `app-shell.tsx`: The main wrapper.
    *   `sidebar.tsx`: Reads from `src/constants/nav.ts`. Hides/shows links based on role. Uses `active` state styling.
    *   `topbar.tsx`: Handles user dropdown, theme toggling, and role-based greetings.
*   **`maintenance/`**:
    *   `ticket-card.tsx`: Visual representation of a repair ticket. Parses severity into colors. Calculates SLA time left.
    *   `ticket-status-badge.tsx`: UI component mapping statuses to Shadcn `badge` variants.
*   **`assets/`**:
    *   `add-hardware-wizard.tsx`: Complex state machine form.
*   **`ui/`**: Core reusable elements (Buttons, Inputs, Cards, Dialogs). Extended with custom variants (e.g., `Button` has a `destructive` variant).

### 3.4 API Integration Layer (`src/services/`)
Services act as the boundary between React Query and Supabase.
*   **`maintenance.ts`**:
    *   `getTickets()`: Fetches tickets + joined hardware details.
    *   `createTicket(values)`: Inserts into `repair_tickets`. Forces `status: "open"`.
    *   `uploadTicketImage(file)`: Uploads to Supabase Storage, returns public URL.
*   **`hardware.ts`**:
    *   `getHardwareList()`: Fetches hardware with joined department info.
    *   `createHardware(values)`: Inserts into `hardware`.

---

## 4. Workflows & Features

### 4.1 Asset Onboarding Flow
1. User navigates to `/assets/add`.
2. Wizard collects hardware type, serial number, and specs.
3. System assigns a location (`department_id`).
4. On save, hardware is inserted, `health_score` defaults to 100.
5. User prints generated QR code label from `/assets/[id]`.

### 4.2 Maintenance Ticketing Flow
1. User/Tech scans QR or navigates to `/maintenance/create`.
2. Selects hardware and sets severity. Uploads photo of damage.
3. Form submitted -> Inserted into `repair_tickets`.
4. **Trigger fires**: Database `auto_reduce_health_score` automatically lowers the hardware's health score.
5. **RLS evaluates**: Technicians see it in their queue; Admins see it globally.
6. Technician dashboard highlights `critical` tickets in red with immediate action prompts.

### 4.3 Theming & UI
*   The application uses `next-themes` to support `light`, `dark`, and `system` preferences.
*   The `globals.css` and `tailwind.config.ts` are heavily customized with CSS variables (e.g., `--background`, `--card`, `--primary`) to create a "glassmorphism" effect (`.glass-card` class).

---

## 5. Security Summary
*   **Authentication**: Managed by Supabase GoTrue.
*   **Middleware Protection**: `src/middleware.ts` forces redirection to `/login` if no valid session is found.
*   **Authorization (DB)**: PostgreSQL Row Level Security.
*   **Authorization (UI)**: `nav.ts` and `RoleContext` hide elements the user cannot access. Server-side fetching strictly adheres to RLS, ensuring UI manipulation cannot expose unauthorized data.
