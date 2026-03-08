# Helix Deployment Guide

## Prerequisites

- Server with Docker Engine 24+ and Docker Compose v2
- A domain name with DNS access
- Ports 80 and 443 open

## Architecture

```
Internet → Caddy (:80/:443)
              ├── admin.domain.com
              │     ├── /api/*  → Backend (:3001)
              │     └── /*     → Frontend (:3000)
              └── *.storefront.com
                    ├── /api/*                    → Backend (:3001)
                    ├── /.well-known/helix-routing → Backend
                    └── /*                        → Frontend

Backend (:3001)
  ├── PostgreSQL (:5432)
  ├── Redis (:6379)
  └── MinIO (:9000)

Portainer CE (:9443) — optional management dashboard
```

All domains (admin + storefront) route `/api/*` directly to the backend via Caddy. The frontend never proxies API requests — cookies are set with `Domain=<request hostname>` so they work across any domain.

All services run in a single `docker-compose.yml`. Portainer CE is optional — install it if you want a web dashboard for container management.

## Quick Start

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. (Optional) Install Portainer CE

```bash
docker volume create portainer_data
docker run -d \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Access at `https://<SERVER_IP>:9443`. Create your admin account on first visit.

### 3. Clone and configure

```bash
git clone <your-repo-url> /opt/helix
cd /opt/helix
cp docker/.env.example .env
```

Edit `.env` and replace all `CHANGE_ME` values:

```bash
# Generate secrets
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # JWT_REFRESH_SECRET
openssl rand -base64 32   # CUSTOMER_JWT_SECRET
openssl rand -base64 32   # CUSTOMER_JWT_REFRESH_SECRET
openssl rand -hex 16      # TLS_ASK_SECRET
```

### 4. Start all services

**Option A — CLI:**
```bash
docker compose up -d
```

**Option B — Portainer:**
1. Go to Stacks > Add Stack
2. Select "Repository" and point to your Git repo
3. Or select "Upload" and paste the docker-compose.yml content
4. Add environment variables from your .env file
5. Deploy

### 5. Seed the database

```bash
docker compose run --rm seed
```

This creates:
- PlatformInstallation (your portal hostname + TLS secret)
- Admin user (from ADMIN_EMAIL / ADMIN_PASSWORD)
- B2B + B2C stores with StoreMember links
- Currencies (TRY, USD, EUR, GBP)
- Base price list

### 6. Configure DNS

Point your PORTAL_HOSTNAME to your server:

```
admin.yourdomain.com  A  <YOUR_SERVER_IP>
```

Caddy auto-obtains a Let's Encrypt certificate.

### 7. Login

Navigate to `https://admin.yourdomain.com` and login with your seeded credentials.

## Environment Variables

### Required

| Variable                    | Description                            |
|-----------------------------|----------------------------------------|
| POSTGRES_PASSWORD           | PostgreSQL password                    |
| JWT_SECRET                  | Admin access token secret              |
| JWT_REFRESH_SECRET          | Admin refresh token secret             |
| CUSTOMER_JWT_SECRET         | Storefront customer JWT secret         |
| CUSTOMER_JWT_REFRESH_SECRET | Storefront customer refresh secret     |
| PORTAL_HOSTNAME             | Admin panel domain                     |
| TLS_ASK_SECRET              | Caddy on-demand TLS secret (32+ chars) |
| CORS_ORIGIN                 | Allowed CORS origin                    |
| FRONTEND_URL                | Frontend URL for OAuth redirects       |
| MINIO_ACCESS_KEY            | MinIO access key                       |
| MINIO_SECRET_KEY            | MinIO secret key                       |
| ADMIN_EMAIL                 | Initial admin email (seed only)        |
| ADMIN_PASSWORD              | Initial admin password (seed only)     |

### Optional (defaults provided)

| Variable        | Default    | Description              |
|-----------------|------------|--------------------------|
| POSTGRES_USER   | helix      | PostgreSQL username      |
| POSTGRES_DB     | helix      | PostgreSQL database name |
| MINIO_BUCKET    | helix      | MinIO bucket name        |
| ADMIN_NAME      | Admin      | Admin first name         |
| ADMIN_SURNAME   | User       | Admin last name          |

### OAuth (optional, leave empty to disable)

| Variable                 | Description               |
|--------------------------|---------------------------|
| GOOGLE_CLIENT_ID         | Google OAuth client ID    |
| GOOGLE_CLIENT_SECRET     | Google OAuth secret       |
| GOOGLE_CALLBACK_URL      | Google OAuth callback     |
| FACEBOOK_CLIENT_ID       | Facebook OAuth app ID     |
| FACEBOOK_CLIENT_SECRET   | Facebook OAuth secret     |
| FACEBOOK_CALLBACK_URL    | Facebook OAuth callback   |
| INSTAGRAM_CLIENT_ID      | Instagram OAuth app ID    |
| INSTAGRAM_CLIENT_SECRET  | Instagram OAuth secret    |
| INSTAGRAM_CALLBACK_URL   | Instagram OAuth callback  |

## API Routing & Cookie Architecture

Caddy routes `/api/*` requests directly to the backend on every domain — the frontend (Next.js) is never involved in API traffic in production.

```
Browser → POST admin.helix.com/api/auth/login
       → Caddy → backend:3001
       → Set-Cookie: Domain=admin.helix.com; HttpOnly; Secure; SameSite=Lax
       → Same-origin ✓

Browser → POST brandstore.com/api/storefront/auth/login
       → Caddy → backend:3001
       → Set-Cookie: Domain=brandstore.com; HttpOnly; Secure; SameSite=Lax
       → Same-origin ✓
```

**Key points:**
- Cookie `Domain` is set dynamically from `req.hostname` — each domain gets scoped cookies
- `BACKEND_INTERNAL_URL` is only used for server-side operations (SSR middleware token refresh)
- Frontend Axios clients use `NEXT_PUBLIC_API_URL` (defaults to `/api`, a relative path)
- In development, Next.js rewrites `/api/*` to the backend (no Caddy needed)

## Adding Storefront Domains

1. Admin panel > Settings > Domain Management
2. Add a Domain Space (e.g. `yourstore.com`)
3. Follow verification:
   - Add TXT record: `_helix-verify.yourstore.com` with provided token
   - Verify ownership
   - Point A/CNAME to server
   - Verify routing
4. Create Store Host Bindings

Caddy automatically issues TLS certificates — no restart needed.

## Common Operations

```bash
# View logs
docker compose logs -f backend
docker compose logs -f caddy

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose build backend frontend
docker compose up -d

# Re-run seed (idempotent)
docker compose run --rm seed

# Access PostgreSQL
docker compose exec postgres psql -U helix

# MinIO console (if port exposed)
# http://<server-ip>:9001
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml` for automated deploys:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/helix
            git pull origin main
            docker compose build backend frontend
            docker compose up -d
```

Or use Portainer's GitOps webhook for automatic redeployment on push.

## Troubleshooting

| Problem                      | Check                                                         |
|------------------------------|---------------------------------------------------------------|
| Backend won't start          | `docker compose logs backend` — check DATABASE_URL, REDIS_URL |
| TLS not working              | Verify TLS_ASK_SECRET matches PlatformInstallation in DB      |
| Storefront returns 404       | Check StoreHostBinding status — must be ACTIVE                |
| Seed fails                   | Ensure postgres is healthy: `docker compose ps`               |
| Caddy certificate errors     | Check port 80/443 are open, DNS is propagated                 |
| Frontend can't reach backend | BACKEND_INTERNAL_URL should be `http://backend:3001` (SSR only) |
| OAuth redirect fails         | Check *_CALLBACK_URL matches your actual domain               |
