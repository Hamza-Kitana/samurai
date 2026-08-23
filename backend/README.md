# Samurai Realm API (.NET 8 + SQL Server / SQLite)

ASP.NET Core Web API with Entity Framework Core. All store data (users, products, orders, downloads, categories, analytics) lives in the database.

## Requirements

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

**Default:** SQLite file `samurai.db` (zero setup).  
**Production:** SQL Server via Docker (see below).

## Quick start

```bash
cd backend/SamuraiRealm.Api
dotnet run
```

API: `http://localhost:5000`  
Health: `GET /api/health`

Default admin (seeded on first run):

- **Username:** `admin`
- **Password:** `222`

## SQL Server (production)

```bash
cd backend
docker compose up -d
```

Set connection string in `SamuraiRealm.Api/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=SamuraiRealm;User Id=sa;Password=SamuraiRealm123!;TrustServerCertificate=True"
}
```

Then:

```bash
cd SamuraiRealm.Api
dotnet run
```

## Frontend connection

In project root `.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Run frontend:

```bash
npm run dev
```

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login`, `register`, `google`, `GET /api/auth/me` |
| Catalog | `GET /api/products`, `/api/products/{slug}`, `/api/categories` |
| Orders | `POST /api/orders`, `GET /api/orders/me` |
| Downloads | `GET /api/downloads/me`, `GET /api/downloads/{productId}/file` |
| Admin | `/api/admin/products`, `/api/admin/categories`, `/api/admin/users/{id}` |
| Analytics | `POST /api/interest`, `GET /api/interest` (admin) |

JWT is returned on login and sent as `Authorization: Bearer <token>`.

Product files are stored under `uploads/packages/` and served at `/uploads/...`.

## Migrations

```bash
cd backend/SamuraiRealm.Api
dotnet ef migrations add MigrationName
dotnet ef database update
```

On startup, pending migrations are applied automatically.
