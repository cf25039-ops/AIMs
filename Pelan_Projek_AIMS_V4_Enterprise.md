# AIMS V5 — Enterprise Infrastructure Asset Management Platform

## Ultimate Master Blueprint & AI Development Instruction File

> Version: V5 Enterprise Max Edition
> Project Codename: AIMS
> Full Name: Advanced Infrastructure Management System
> Architecture Level: Enterprise / Government Grade
> Target Stack: Next.js 15 + Supabase + TypeScript
> UI Direction: Ultra Modern Enterprise Dashboard
> Standard: Production-Ready Architecture

---

# 1. PROJECT OVERVIEW

## Overall Project Progress (Live)
- [x] **Project Scaffolding** (Next.js 15, Tailwind, Shadcn UI)
- [x] **Enterprise Folder Architecture** (app/ layouts, components, db)
- [x] **Database Schema Definition** (Drizzle ORM implementation)
- [x] **Database SQL Scripts Generation** (`aims_init.sql`)
- [x] **Database Deployment** (Run SQL in Supabase)
- [x] **Environment Configuration** (.env.local set up)
- [x] **UI Layout & Shell** (Sidebar, Topbar, App Shell)
- [x] **Multi-step Asset Wizard UI** (Add Hardware Flow)
- [x] **Backend Integration** (Connect APIs/Realtime functionalities)
- [x] **Module 1: Authentication & Security** (Supabase Auth, SSR, Middleware)
- [x] **Module 5: Maintenance & Repair System** (Ticketing, Storage Bucket)
- [x] **Module 4: Asset Movement Tracking** (Hardware Transfer UI, Admin Verification)
- [x] **Module 6: Audit & Compliance System** (Immutable Logs, JSON Viewer)
- [x] **Module 2: Project & Contract Management** (Contract Matrix, Expiring Tracker)
- [x] **Module 9: Reporting & Analytics** (Recharts Visuals, CSV Export Script)
- [x] **Module 8: QR & Barcode System** (Asset Detail Page, Print Label)
- [x] **Module 10: Vendor Management** (Vendor Directory, Contract Binding count)
- [x] **Module 7: Notification System** (Enterprise Inbox UI, Mark as Read)
- [x] **Module 11: Warehouse & Stock Management** (Low Stock Alerts, PR Requests)
- [x] **Module 12: AI & Intelligence Layer** (Asset Health Score, Smart Recommendations)

## Core Vision

AIMS is not a normal inventory system.

AIMS is a fully scalable:

* Enterprise Asset Management Platform
* Infrastructure Monitoring Platform
* Hardware Lifecycle Management System
* Maintenance & SLA Tracking System
* Multi-Tenant Contract-Based Infrastructure Platform
* Audit & Compliance Ready Platform

The system must support:

* Government agencies
* Hospitals
* Universities
* Enterprise companies
* Managed service providers (MSP)
* IT contractors
* Multi-region deployments

The system architecture must feel comparable to:

* ServiceNow
* IBM Maximo
* ManageEngine
* Atlassian Admin Systems
* Linear
* Vercel Dashboard

The UI and UX MUST look modern, futuristic, responsive, smooth, premium, and enterprise-grade.

---

# 2. CORE SYSTEM OBJECTIVES

## Main Objectives

### Asset Lifecycle Management

Track hardware from:

```txt
Procurement
→ Warehouse
→ Deployment
→ Active Usage
→ Maintenance
→ Transfer
→ Standby
→ Retirement
→ Disposal
```

---

### Contract-Based Management

Every hardware asset belongs to:

```txt
Project
→ Contract
→ Region
→ State
→ Facility
→ Department
```

This is critical for:

* Vendor tracking
* Government contracts
* Billing
* SLA
* Multi-client isolation
* Reporting

---

### Maintenance Intelligence

Track:

* Repair history
* Downtime
* Failure rate
* Repeat issue detection
* Technician performance
* Vendor repair performance
* Asset health score

---

### Full Audit Transparency

Every system activity MUST be logged.

Track:

* WHO
* DID WHAT
* WHEN
* WHERE
* OLD VALUE
* NEW VALUE
* IP ADDRESS
* DEVICE

Immutable audit trail.

---

# 3. SYSTEM ARCHITECTURE

## Enterprise Hierarchy Structure

```txt
Project
 └── Contracts
      └── Regions
           └── States
                └── Facilities
                     └── Departments
                          └── Assets
```

---

## Example Structure

```txt
KKM
 └── KKM-ICT-2026-001
      └── Central Region
           └── Selangor
                └── Hospital Shah Alam
                     └── Emergency Department
                          └── Dell Latitude 5420
```

---

# 4. ENTERPRISE CORE MODULES

# MODULE 1 — Authentication & Security

## Features

- [ ] Secure Login
- [ ] MFA Authentication
- [ ] Session Management
- [ ] Device Tracking
- [ ] Login Activity
- [ ] Password Policies
- [ ] Password Expiry
- [ ] Role-Based Access Control (RBAC)
- [ ] Permission Matrix
- [ ] IP Restriction
- [ ] Geo Restriction
- [x] Audit Logging (DB Schema Ready)
- [ ] Security Monitoring

## Authentication Flow

```txt
Login
→ MFA Verification
→ Session Validation
→ Permission Check
→ Dashboard Access
```

## Roles

```txt
Super Admin
Project Admin
Regional Admin
State Admin
Facility Admin
Department PIC
Technician
Vendor
Auditor
Viewer
Finance Officer
Warehouse Staff
```

---

# MODULE 2 — Project & Contract Management

## Features

### Project Management

- [x] Create project (DB Schema Done)
- [ ] Manage project status
- [x] Project owner (DB Schema Done)
- [ ] Project categories
- [ ] Project analytics

### Contract Management

- [x] Contract number (DB Schema Done)
- [x] Contract duration
- [x] Contract start date
- [x] Contract expiry
- [x] Vendor linkage
- [x] Contract value
- [x] SLA assignment
- [ ] Auto expiry reminder
- [ ] Renewal tracking

### Contract Dashboard

Display:

- [ ] Active contracts
- [ ] Expiring contracts
- [ ] Contract health
- [ ] Asset count per contract
- [ ] SLA status
- [ ] Vendor performance

---

# MODULE 3 — Asset Management

## Hardware Categories

```txt
Desktop PC
Laptop
Printer
Scanner
Server
Router
Switch
Firewall
Access Point
IP Phone
Tablet
Mobile Device
CCTV
Storage
UPS
Medical Equipment
Specialized Equipment
```

---

## Required Asset Fields

| Field           | Description                |
| --------------- | -------------------------- |
| Asset ID        | Unique internal asset ID   |
| Serial Number   | Manufacturer serial number |
| QR Code         | Auto-generated QR          |
| Barcode         | Auto-generated barcode     |
| Asset Tag       | Internal tracking code     |
| PIC Name        | Responsible person         |
| Contact Number  | PIC contact                |
| Project         | Related project            |
| Contract        | Related contract           |
| Region          | Region assignment          |
| State           | State assignment           |
| Facility        | Facility assignment        |
| Department      | Department assignment      |
| Hardware Type   | Device category            |
| Brand           | Manufacturer               |
| Model           | Device model               |
| CPU             | Processor                  |
| RAM             | Memory                     |
| Storage         | Disk size                  |
| MAC Address     | Network MAC                |
| IP Address      | Assigned IP                |
| Purchase Date   | Procurement date           |
| Warranty Expiry | Warranty end               |
| Asset Status    | Current status             |
| Asset Condition | Good/Fair/Damaged          |
| Vendor          | Vendor information         |
| Notes           | Extra notes                |

---

## Asset Status Types

```txt
Active
Standby
In Repair
In Store
Retired
Disposed
Lost
Transferred
Reserved
Pending Deployment
```

---

# MODULE 4 — Asset Movement Tracking

## Purpose

Track every movement of hardware assets.

## Features

- [x] Department transfer (DB Schema Ready)
- [x] Facility transfer (DB Schema Ready)
- [x] State transfer (DB Schema Ready)
- [x] Contract reassignment (DB Schema Ready)
- [ ] Temporary assignment
- [ ] Check-in/check-out
- [ ] Approval workflow
- [ ] Handover documentation

## Transfer Log Structure

```txt
Transfer ID
Asset ID
From Location
To Location
From PIC
To PIC
Approved By
Transfer Reason
Transfer Date
Handover Attachment
Timestamp
```

---

# MODULE 5 — Maintenance & Repair System

## Repair Ticket System

### Features

- [x] Ticket creation (DB Schema Ready)
- [x] Severity levels (DB Schema Ready)
- [ ] SLA timer
- [x] Technician assignment (DB Schema Ready)
- [ ] Vendor escalation
- [x] Repair attachments (DB Schema Ready)
- [x] Before/after images (DB Schema Ready)
- [x] Repair cost tracking (DB Schema Ready)
- [ ] Downtime analytics
- [x] Resolution notes (DB Schema Ready)

---

## Ticket Severity

```txt
Critical
High
Medium
Low
Informational
```

---

## Ticket Workflow

```txt
Open
→ Assigned
→ Investigation
→ In Repair
→ Vendor Escalation
→ Testing
→ Resolved
→ Closed
```

---

## SLA Engine

### Example SLA

```txt
Critical → 4 Hours
High → 8 Hours
Medium → 24 Hours
Low → 72 Hours
```

### SLA Features

* Live countdown
* Escalation alerts
* SLA breach detection
* Performance metrics
* Technician SLA reports
* Vendor SLA reports

---

# MODULE 6 — Audit & Compliance System

## Audit Features

Every activity MUST be recorded.

### Track:

- [ ] Login
- [ ] Logout
- [x] Asset creation (DB Triggers Ready)
- [x] Asset modification (DB Triggers Ready)
- [x] Status changes (DB Triggers Ready)
- [x] Transfer actions (DB Triggers Ready)
- [ ] Permission changes
- [x] Repair updates (DB Triggers Ready)
- [ ] Data export
- [ ] Deletion attempts

---

## Immutable Audit Log

Logs cannot be edited.

Only:

* Append new logs
* View logs
* Export logs

Never allow edit/delete.

---

# MODULE 7 — Notification System

## Notification Channels

* In-app notification
* Email notification
* Push notification
* SMS integration ready
* WhatsApp integration ready

## Notification Events

* SLA breach
* Asset transfer
* New repair ticket
* Contract expiry
* Warranty expiry
* Login alerts
* Security alerts
* Vendor escalation

---

# MODULE 8 — QR & Barcode System

## QR Features

* Auto generate QR
* Printable QR labels
* Scan using mobile
* Open asset profile instantly
* Asset verification
* Quick status update

## Barcode Features

* Barcode generation
* Barcode printing
* Inventory scanning
* Bulk inventory verification

---

# MODULE 9 — Reporting & Analytics

## Dashboard Analytics

### Real-Time Widgets

* Total assets
* Active assets
* Offline assets
* Assets under repair
* SLA breaches
* Asset health score
* Contract performance
* Vendor performance
* Repair cost analytics
* Asset aging analytics
* Transfer analytics

---

## Charts

Use:

* Animated charts
* Interactive graphs
* Heatmaps
* Timeline charts
* Donut charts
* Trend analysis

---

## Reports

### Export Support

* PDF
* Excel
* CSV
* Print-ready reports

### Report Types

* Asset inventory report
* SLA report
* Maintenance report
* Audit report
* Vendor report
* Financial report
* Downtime report
* Warranty report

---

# MODULE 10 — Vendor Management

## Vendor Features

* Vendor profiles
* Vendor contracts
* Vendor SLA tracking
* Vendor response time
* Vendor repair history
* Vendor performance scoring

---

# MODULE 11 — Warehouse & Stock Management

## Features

* Incoming stock
* Outgoing stock
* Spare part inventory
* Warehouse transfer
* Minimum stock alerts
* Asset reservation
* Purchase request workflow

---

# MODULE 12 — AI & Intelligence Layer

## AI Features

### Predictive Maintenance

Detect:

* Frequent failure patterns
* High-risk devices
* Abnormal repair frequency

---

### Smart Recommendations

Suggest:

* Device replacement
* Vendor escalation
* Warranty action
* Maintenance scheduling

---

### Asset Health Score

Example:

```txt
90-100 = Excellent
70-89 = Good
50-69 = Warning
0-49 = Critical
```

Based on:

* Downtime
* Repair frequency
* Age
* Hardware condition
* SLA history

---

# 5. UI & UX MASTER DIRECTION

# IMPORTANT

The UI MUST NOT look like:

* Old government system
* Basic admin template
* Bootstrap dashboard
* Traditional CRUD system

The UI MUST feel:

* Premium
* Futuristic
* Clean
* Smooth
* Responsive
* Interactive
* Intelligent
* Enterprise-grade

---

# DESIGN REFERENCES

UI inspiration:

* Linear
* Vercel
* Notion
* Stripe Dashboard
* Framer
* ServiceNow modern UI
* Atlassian Admin
* Raycast

---

# VISUAL DESIGN SYSTEM

## Color Palette

### Light Mode

```txt
Background: #F8FAFC
Card: #FFFFFF
Border: #E2E8F0
Primary: #2563EB
Accent: #7C3AED
Success: #10B981
Danger: #EF4444
Warning: #F59E0B
```

---

### Dark Mode

```txt
Background: #020617
Card: #0F172A
Border: #1E293B
Primary: #3B82F6
Accent: #8B5CF6
```

---

# ANIMATION REQUIREMENTS

## Animation Philosophy

Animations MUST feel:

* Smooth
* Premium
* Fast
* Modern
* Responsive
* Natural

Avoid:

* Slow animations
* Cheap effects
* Overly flashy transitions
* Laggy interactions

---

## Required Animation Features

### Page Transitions

* Smooth fade
* Blur transitions
* Slide animations
* Route transition animation

### Card Animations

* Hover elevation
* Glow effect
* Smooth scaling
* Gradient animation

### Dashboard Animations

* Live counter animations
* Animated charts
* Real-time updates
* Skeleton loading

### Table Animations

* Smooth row expansion
* Animated filtering
* Live search transition
* Dynamic sorting animation

### Modal Animations

* Spring opening effect
* Background blur
* Smooth scale animation

### Notification Animations

* Slide-in notifications
* Real-time alert pulse
* Status color animation

### Loading Animations

* Skeleton loaders
* Pulse effects
* Gradient shimmer
* Progressive loading

---

# UX REQUIREMENTS

## UX Principles

### Fast Workflow

Admin should:

* Add hardware quickly
* Search instantly
* Navigate easily
* Access information fast

---

### Minimal Friction

Reduce:

* Clicks
* Reloads
* Form confusion
* Complex navigation

---

### Smart UI

Use:

* Auto suggestions
* Dynamic filtering
* Command palette
* Keyboard shortcuts
* Smart search
* Context menus

---

# ADVANCED UI FEATURES

## Command Palette

Like:

```txt
CTRL + K
```

Allows:

* Search asset
* Open page
* Quick actions
* Create ticket
* Transfer asset

---

## Global Search

Search everything:

* Assets
* Contracts
* Users
* Tickets
* Facilities
* Vendors

Realtime instant results.

---

## Live Activity Feed

Display:

* Latest asset updates
* Ticket activity
* SLA alerts
* Transfer actions
* Login events

Realtime.

---

# 6. DATABASE ARCHITECTURE

# Core Tables

```txt
users
roles
permissions
role_permissions
user_sessions

projects
contracts
vendors

regions
states
facilities
departments

assets
asset_types
brands
models

asset_movements
asset_assignments

repair_tickets
repair_logs
repair_attachments

status_logs
sla_policies
sla_events

notifications
notification_logs

attachments
activity_logs
audit_logs

warehouse_items
stock_movements
purchase_requests

asset_health_scores
analytics_snapshots
```

---

# DATABASE REQUIREMENTS

## PostgreSQL Standards

Must use:

* UUID primary keys
* Foreign keys
* Index optimization
* Soft delete
* Timestamps
* Audit triggers
* RLS policies

---

## Supabase Requirements

Use:

* Supabase Auth
* Supabase Storage
* Realtime subscriptions
* Edge Functions
* Row Level Security
* Database Functions

---

# 7. TECH STACK

## Frontend

```txt
Next.js 15
React 19
TypeScript
Tailwind CSS
Shadcn UI
Framer Motion
TanStack Table
React Query
Zod
React Hook Form
```

---

## Backend

```txt
Supabase
PostgreSQL
Edge Functions
Realtime Engine
```

---

## Charts & Visualization

```txt
Recharts
ECharts
D3.js
```

---

## QR & Barcode

```txt
qrcode
react-qr-code
JsBarcode
```

---

# 8. PERFORMANCE REQUIREMENTS

## Performance Standards

### Page Load

```txt
< 2 seconds
```

### Search Speed

```txt
< 300ms
```

### Dashboard Refresh

```txt
Realtime
```

---

## Optimization

Use:

* Lazy loading
* Dynamic imports
* Virtualized tables
* Image optimization
* Caching
* Pagination
* Infinite scrolling

---

# 9. RESPONSIVE DESIGN

## Supported Devices

* Desktop
* Laptop
* Tablet
* Mobile
* Large display monitor

---

## Mobile Requirements

### Technician Mobile Usage

Allow:

* QR scan
* Quick asset update
* Ticket update
* Mobile dashboard
* Offline-ready future support

---

# 10. ENTERPRISE SECURITY

## Security Requirements

### Must Have

* Row-level security
* Input sanitization
* Rate limiting
* CSRF protection
* XSS protection
* Secure headers
* Secure session handling
* MFA support
* Audit logging

---

## Data Protection

Encrypt:

* Passwords
* Sensitive tokens
* Session tokens
* Critical data

---

# 11. FILE STRUCTURE REQUIREMENTS

## Enterprise Folder Structure

```txt
src/
 ├── app/
 ├── components/
 │    ├── ui/
 │    ├── dashboard/
 │    ├── assets/
 │    ├── contracts/
 │    ├── tickets/
 │    ├── analytics/
 │    ├── layouts/
 │    └── animations/
 │
 ├── lib/
 ├── hooks/
 ├── services/
 ├── store/
 ├── types/
 ├── utils/
 ├── schemas/
 ├── constants/
 ├── styles/
 └── middleware/
```

---

# 12. DASHBOARD REQUIREMENTS

## Dashboard MUST Include

### Executive Dashboard

* Total assets
* Financial value
* SLA compliance
* Vendor analytics
* Asset trends

---

### Operational Dashboard

* Active tickets
* Assets under repair
* Critical alerts
* Realtime activity
* Technician status

---

### Technician Dashboard

* Assigned tickets
* SLA countdown
* Daily workload
* Repair history

---

# 13. FUTURE EXPANSION SUPPORT

System MUST be scalable for:

## Phase 2

* Mobile app
* Push notifications
* Offline sync
* AI analytics

---

## Phase 3

* Network monitoring
* SNMP integration
* Device heartbeat
* Remote management

---

## Phase 4

* AI failure prediction
* AI maintenance planning
* Smart automation
* Autonomous reporting

---

# 14. FINAL AI DEVELOPMENT INSTRUCTIONS

# IMPORTANT

The AI MUST:

* Build production-quality code
* Use clean architecture
* Use reusable components
* Use scalable patterns
* Use TypeScript strictly
* Use enterprise coding standards
* Use proper folder organization
* Use modular architecture
* Use reusable hooks
* Use reusable services
* Use reusable UI components

---

# UI REQUIREMENTS

The UI MUST:

* Look futuristic
* Have smooth animations
* Have modern interactions
* Use responsive layouts
* Use premium dashboard design
* Use animated transitions
* Use glassmorphism lightly
* Use clean typography
* Use premium tables
* Use animated charts
* Use realtime activity

---

# UX REQUIREMENTS

The UX MUST:

* Feel fast
* Feel intelligent
* Minimize clicks
* Reduce user friction
* Have intuitive navigation
* Support power users
* Support keyboard shortcuts
* Support command palette

---

# DEVELOPMENT STANDARDS

The AI MUST:

* Avoid messy code
* Avoid duplicated logic
* Avoid outdated design
* Avoid bootstrap-style layouts
* Avoid old admin template appearance
* Avoid poor responsiveness
* Avoid inconsistent spacing
* Avoid poor animation timing

---

# FINAL SYSTEM TARGET

The final result MUST feel like:

```txt
Enterprise SaaS Platform
+ Modern AI Dashboard
+ Government-Grade Asset Management
+ Real-Time Monitoring Platform
+ Premium UX Application
```

The system should look deployable to:

* Government agencies
* Hospitals
* Universities
* Enterprise corporations
* MSP companies
* National infrastructure projects

---

# END OF MASTER BLUEPRINT

AIMS V5 — Enterprise Infrastructure Asset Management Platform
Ultimate Enterprise Edition
