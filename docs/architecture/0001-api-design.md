# ADR 0001: API Design — Server Actions vs REST

**Status**: Accepted (2026-06-07)
**Deciders**: Haziq (lead), Hermes (advisor)

## Context

AIMS perlu data layer untuk web app. Options:

1. Next.js Server Actions (current implementation)
2. REST API (`/api/*` route handlers)
3. GraphQL
4. Supabase Edge Functions

## Decision

**Server Actions + direct Supabase client calls** (Option 1).

## Rationale

- ✅ End-to-end TypeScript (no manual DTO mapping)
- ✅ Supabase RLS auto-applied (security by default)
- ✅ TanStack Query for caching + real-time
- ✅ Less boilerplate (no route handler per CRUD)
- ✅ Next.js 14+ best practice

## Consequences

**Positive**:
- Faster development (~30% less code vs REST)
- Type-safe across stack
- Easy to add real-time subscriptions

**Negative**:
- ❌ Mobile app integration need separate REST layer
- ❌ Third-party API consumers not supported
- ❌ No versioning strategy (URL-based like `/api/v1/`)

## When to Revisit

Trigger conditions for building REST layer:
- [ ] KKM explicitly requests mobile app
- [ ] Third-party system needs asset data
- [ ] More than 3 external integration requests

Until then, Server Actions pattern kekal.

## Alternatives Considered

### REST API
- Pro: Universal compatibility, easy to version
- Con: Duplicate code (server actions + routes), manual auth checks, more boilerplate

### Supabase Edge Functions
- Pro: Serverless, Deno runtime
- Con: Vendor lock-in, cold start latency, different runtime (Deno vs Node)

### GraphQL
- Pro: Flexible queries
- Con: Overkill for CRUD-heavy app, complex caching

## References

- [Next.js Server Actions docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase + Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
