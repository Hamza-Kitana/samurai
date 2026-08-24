# Samurai Realm

Project guidelines for AI agents working on this codebase.

## Stack

- TanStack Start + TanStack Router (file-based routing in `src/routes/`)
- Frontend-only: localStorage data layer in `src/lib/data.ts` (no backend / no Supabase)
- Tailwind CSS 4 + shadcn/ui components in `src/components/ui/`
- State: React Context (`src/lib/store.tsx`, `src/lib/i18n.tsx`)

## Conventions

- Routes go in `src/routes/` — do not create `src/pages/`
- `routeTree.gen.ts` is auto-generated; don't edit manually
- Use `@/` path alias for imports
- Arabic is the default language; i18n keys in `src/lib/i18n.tsx`
- Products, auth, orders, and interest live in localStorage via `src/lib/data.ts`

## Key files

- `src/routes/__root.tsx` — app shell, providers
- `src/lib/store.tsx` — cart + auth context
- `src/lib/data.ts` — seeded products + local CRUD
- `src/lib/products.ts` — product queries
- `src/lib/checkout.ts` — order creation + downloads

## Admin

Default admin: username `admin` / password `222`
