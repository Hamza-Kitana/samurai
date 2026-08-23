# Samurai Realm

Project guidelines for AI agents working on this codebase.

## Stack

- TanStack Start + TanStack Router (file-based routing in `src/routes/`)
- **Backend:** ASP.NET Core 8 API in `backend/` + SQL Server (EF Core)
- Frontend talks to API via `src/lib/api.ts` (`VITE_API_URL`)
- Tailwind CSS 4 + shadcn/ui components in `src/components/ui/`
- State: React Context (`src/lib/store.tsx`, `src/lib/i18n.tsx`)

## Conventions

- Routes go in `src/routes/` — do not create `src/pages/`
- `routeTree.gen.ts` is auto-generated; don't edit manually
- Use `@/` path alias for imports
- Arabic is the default language; i18n keys in `src/lib/i18n.tsx`
- Products, auth, orders, and interest live in **SQL Server** via the C# API
- Cart remains in localStorage (`samurai-cart`)

## Key files

- `backend/SamuraiRealm.Api/` — C# API + EF Core + JWT auth
- `src/lib/api.ts` — frontend API client
- `src/routes/__root.tsx` — app shell, providers
- `src/lib/store.tsx` — cart + auth context
- `src/lib/checkout.ts` — order creation + downloads

## Admin

Default admin: username `admin` / password `222` (seeded in database)

## Local dev

1. `cd backend/SamuraiRealm.Api && dotnet run`
2. `npm run dev` (with `VITE_API_URL=http://localhost:5000` in `.env`)
