# Docker Configuration

This directory contains Docker Compose configurations for different environments.

## Files

- `docker-compose.local.yml` - Local development environment
- `docker-compose.dev.yml` - QA/Testing environment (future)
- `docker-compose.prod.yml` - Production environment (future)
- `.env` - Docker Compose configuration (sets project name to "imajin")

## Local Development Setup

### Prerequisites

- Docker Desktop installed and running
- `.env.local` file created (copy from `.env.local.example` in root)

### Starting the Database

```bash
# From the web/ directory
docker compose -f docker/docker-compose.local.yml up -d

# Or create a convenience script in package.json:
npm run docker:up
```

### Stopping the Database

```bash
docker compose -f docker/docker-compose.local.yml down

# Or:
npm run docker:down
```

### Checking Database Status

```bash
docker compose -f docker/docker-compose.local.yml ps
docker logs imajin-db-local
```

### Connecting to the Database

**From the Next.js application:**
- Use `DATABASE_URL` from `.env.local`
- Connection: `postgresql://imajin:imajin_dev@localhost:5435/imajin_local`

**From database client (DBeaver, pgAdmin, psql):**
- Host: `localhost`
- Port: `5435`
- Database: `imajin_local`
- User: `imajin`
- Password: `imajin_dev`

**From psql command line:**
```bash
psql -h localhost -p 5435 -U imajin -d imajin_local
# Password: imajin_dev
```

### Optional: pgAdmin GUI

Uncomment the `pgadmin` service in `docker-compose.local.yml` to enable the web-based database management interface.

Access at: http://localhost:5050

## Database Persistence

Database data is stored in a Docker volume named `imajin-db-local-data`. This persists between container restarts.

### Resetting the Database

To completely reset the database and start fresh:

```bash
# Stop containers
docker compose -f docker/docker-compose.local.yml down

# Remove volume
docker volume rm imajin-db-local-data

# Start fresh
docker compose -f docker/docker-compose.local.yml up -d
```

## Network

The local environment creates a Docker network named `imajin-local` that all services use to communicate.

## Future: Next.js Container

Currently, only the database runs in Docker. The Next.js application runs directly on the host (your Windows machine) during development.

In the future, we may add a Next.js container for a fully containerized development environment.

## Troubleshooting

### Port Already in Use

If port 5435 is already in use, change `DB_PORT` in `.env.local` and update the port mapping in `docker-compose.local.yml`.

### Database Won't Start

Check logs:
```bash
docker logs imajin-db-local
```

### Connection Refused

1. Ensure Docker container is running: `docker ps`
2. Check port mapping: `docker port imajin-db-local`
3. Verify credentials in `.env.local` match `docker-compose.local.yml`

### Health Check Failing

Wait 30 seconds after startup for health check to stabilize. Check with:
```bash
docker compose -f docker/docker-compose.local.yml ps
```

Look for "(healthy)" status next to the database container.
