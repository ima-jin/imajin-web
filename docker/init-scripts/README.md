# Database Initialization Scripts

This directory contains SQL scripts that run automatically when the PostgreSQL container is first created.

## How It Works

- Scripts are executed in alphabetical order
- Only runs on initial database creation (not on restart)
- Files should be named with numeric prefixes for ordering: `01-extensions.sql`, `02-schema.sql`, etc.

## Current Status

No initialization scripts yet. Database schema will be managed by Drizzle ORM migrations.

## Future Use Cases

- Installing PostgreSQL extensions (e.g., `uuid-ossp`, `pg_trgm`)
- Creating additional databases
- Setting up specific roles/permissions
- Seeding initial data (though Drizzle seed scripts are preferred)
