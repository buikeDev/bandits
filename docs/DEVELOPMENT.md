# Development Guide

## Workspace Setup

This is a monorepo using pnpm workspaces. All packages are in the root `package.json` under the `workspaces` field.

## Working with the Monorepo

### Running Commands

To run a command in a specific package:

```bash
pnpm --filter @bandit/backend dev
pnpm --filter @bandit/frontend build
```

To run a command in all packages:

```bash
pnpm -r run build
pnpm -r run lint
```

To run commands in parallel:

```bash
pnpm -r --parallel run dev
```

## Backend Development

### Location

`apps/backend/`

### Architecture Pattern

**Route → Controller → Service → Repository → Prisma**

All backend code follows this layered architecture:

- **Routes**: API endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic
- **Repository**: Data access patterns
- **Prisma**: Database ORM

### Database

Database configuration is in `packages/database/`.

#### Prisma Commands

Generate Prisma client:

```bash
pnpm -r run db:generate
```

Create and run migrations:

```bash
pnpm -r run db:migrate
```

Push schema to database:

```bash
pnpm -r run db:push
```

Open Prisma Studio:

```bash
pnpm -r run db:studio
```

Reset database (WARNING: deletes all data):

```bash
pnpm -r run db:reset
```

## Frontend Development

### Location

`apps/frontend/`

### Pages Structure

Pages are defined in `src/app/`. Use Next.js 14 App Router conventions:

- `src/app/page.tsx` - Home page
- `src/app/products/page.tsx` - Products listing
- `src/app/products/[id]/page.tsx` - Product detail

### Components

Reusable components go in `src/components/`.

### Styling

- Tailwind CSS for utility styling
- Place component styles alongside components
- Avoid inline styles; use Tailwind classes

### Environment Variables

Frontend environment variables must be prefixed with `NEXT_PUBLIC_`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Shared Packages

### packages/shared

Common types, utilities, and constants used across frontend and backend.

Export from `src/index.ts`.

### packages/ui

Reusable React components library. Used by the frontend.

Export from `src/index.ts`.

### packages/database

Prisma schema and database utilities. Contains migration files.

## Code Style

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Prefer explicit types over `any`
- Use interfaces for object shapes

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `UserService`, `IUser`)
- **Functions/Variables**: camelCase (e.g., `getUserById()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Imports

Use absolute imports with path aliases:

```typescript
import { User } from '@shared/types';
import { Button } from '@ui/components';
```

## Linting & Formatting

ESLint and Prettier are configured at the root level and applied to all packages.

### Format Code

```bash
pnpm format
```

### Lint Code

```bash
pnpm lint
```

### Check Types

```bash
pnpm type-check
```

## Git Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -am "feat: add my feature"`
3. Push: `git push origin feature/my-feature`
4. Create a pull request

### Commit Message Format

Follow conventional commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code restructuring
- `test:` for tests
- `chore:` for build/setup

Example: `feat: add wristband product listing`

## Before Pushing Code

1. Run `pnpm type-check` - ensure no TypeScript errors
2. Run `pnpm lint` - ensure code meets linting standards
3. Run `pnpm format` - format code
4. Test locally with `pnpm dev`

## Troubleshooting

### pnpm install fails

Clear pnpm cache:

```bash
pnpm store prune
```

Delete node_modules and reinstall:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors

Regenerate types:

```bash
pnpm type-check
```

Clear tsc cache:

```bash
rm -rf dist build .next
pnpm build
```

### Database issues

Reset and remigrate:

```bash
pnpm -r run db:reset
```

## Architecture Principles

- **Modular Monolith**: Single repository with separate packages for clear boundaries
- **Layered Backend**: Clean separation of concerns (routes → controllers → services → repository)
- **Shared Types**: Centralized types in `@bandit/shared` to reduce duplication
- **Type Safety**: Strict TypeScript across all packages
- **Code Organization**: Files organized by feature/domain, not by type

## Next Steps

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed folder structure.

See [ARCHITECTURE.md](ARCHITECTURE.md) for technical architecture details.
