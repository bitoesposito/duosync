# Docker Setup

## Development

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

**Services:**
- App: http://localhost:3000
- Mailpit (email testing): http://localhost:8025
- PostgreSQL: localhost:5432

**Database reset:**
```bash
docker compose -f docker/docker-compose.dev.yml down -v
```

## Production

Requires `.env` file with:
```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://user:password@postgres:5432/duosync
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://yourdomain.com
EMAIL_SERVER=smtp://user:pass@host:port
EMAIL_FROM=noreply@yourdomain.com
```

```bash
docker compose -f docker/docker-compose.yml up --build -d
```
