---
name: Pulsefy tech stack
description: Core technology choices for frontend, backend, and database
type: project
---

Frontend: React 18 + TypeScript + Vite, shadcn/ui components, React Query for data fetching, React Router for navigation.

Backend: Node.js + Express.js (ES modules), REST API on port 4000, PostgreSQL via `pg` (no ORM — raw SQL).

Auth: JWT stored in localStorage, `Authorization: Bearer` header pattern, stateless.

**Why:** Rapid iteration, shared JS knowledge, no SSR needed (fully authenticated client-rendered app).

**How to apply:** When suggesting new features, keep to this stack. No Prisma, no GraphQL, no Next.js.
