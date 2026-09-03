# BANDIT

A modern ecommerce and fulfilment platform for wristbands and related products.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.0.0+
- PostgreSQL 14+

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your PostgreSQL connection string and API URL.

### Development

Start all development servers:

```bash
pnpm dev
```

This runs:

- Frontend (Next.js) on http://localhost:3000
- Backend (Express) on http://localhost:3001

### Build

Build all packages:

```bash
pnpm build
```

### Lint & Format

Run linting across all packages:

```bash
pnpm lint
```

Format code with Prettier:

```bash
pnpm format
```

### Type Checking

Check TypeScript types:

```bash
pnpm type-check
```

## Project Structure

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for detailed information about the monorepo structure.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical architecture details.

See [docs/PROJECTS.md](docs/PROJECTS.md) for project context and business requirements.

## Development Guide

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for development guidelines and best practices.

## Tech Stack

**Frontend:**

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

**Backend:**

- Express.js
- TypeScript
- Node.js

**Database:**

- PostgreSQL
- Prisma ORM
- Neon (cloud hosting)

## Platform Pillars

1. **Wristbands** - Primary product (Tyvek, vinyl, rubber, fabric variants)
2. **Marketplace** - Third-party product visibility
3. **Fulfilment** - Business fulfillment services

## License

MIT
