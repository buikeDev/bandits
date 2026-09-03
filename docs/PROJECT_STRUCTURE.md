# Project Structure

## Root Level

```
bandits/
├── apps/                    # Applications
│   ├── frontend/           # Next.js application
│   └── backend/            # Express API
├── packages/               # Shared packages
│   ├── shared/            # Types, utils, constants
│   ├── ui/                # Reusable React components
│   └── database/          # Prisma schema and migrations
├── docs/                  # Documentation
├── package.json           # Root workspace configuration
├── tsconfig.json          # Root TypeScript configuration
├── .eslintrc.json         # Linting rules
├── .prettierrc             # Code formatting rules
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore rules
├── README.md              # Project overview
└── AGENTS.md              # Project guidelines
```

## apps/backend

```
apps/backend/
├── src/
│   ├── index.ts           # Entry point
│   ├── config/            # Configuration
│   ├── routes/            # Route definitions
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   ├── middleware/        # Express middleware
│   ├── types/             # Type definitions
│   └── utils/             # Utility functions
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── .env
```

### Backend Architecture Pattern

```
Request
  ↓
Route (expresses.get('/users/:id'))
  ↓
Controller (handles request/response)
  ↓
Service (business logic)
  ↓
Repository (data access pattern)
  ↓
Prisma (ORM query)
  ↓
Database (PostgreSQL)
```

## apps/frontend

```
apps/frontend/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── [route]/       # Dynamic routes
│   ├── components/        # React components
│   │   └── [feature]/     # Feature components
│   ├── lib/               # Utilities
│   ├── styles/            # Global styles
│   ├── types/             # Type definitions
│   └── hooks/             # Custom React hooks
├── public/                # Static assets
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local
```

## packages/shared

```
packages/shared/
├── src/
│   ├── index.ts           # Main export
│   ├── types/             # Type definitions
│   │   ├── api.ts        # API types
│   │   ├── models.ts     # Domain model types
│   │   └── common.ts     # Common types
│   ├── constants/         # Constants
│   ├── utils/             # Utility functions
│   └── schemas/           # Zod validation schemas
├── package.json
└── tsconfig.json
```

## packages/ui

```
packages/ui/
├── src/
│   ├── index.ts           # Main export
│   ├── components/        # React components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── [component]/
│   └── hooks/             # UI-specific hooks
├── package.json
└── tsconfig.json
```

## packages/database

```
packages/database/
├── src/
│   ├── index.ts           # Main export
│   └── utils/             # Database utilities
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── package.json
└── tsconfig.json
```

## Domain Organization (Future)

As the project grows, organize code by domain:

```
apps/backend/src/
├── auth/                  # Authentication domain
│   ├── routes.ts
│   ├── controller.ts
│   ├── service.ts
│   ├── repository.ts
│   └── types.ts
├── users/                 # User domain
├── products/              # Product domain
├── wristbands/            # Wristband domain
├── cart/                  # Cart domain
├── orders/                # Order domain
├── payments/              # Payment domain
├── inventory/             # Inventory domain
├── customization/         # Customization domain
├── marketplace/           # Marketplace domain
└── fulfilment/            # Fulfilment domain
```

Each domain has:

- `routes.ts` - Route definitions
- `controller.ts` - Request handlers
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Type definitions

## Key Files

### Configuration Files

- `package.json` - NPM metadata and dependencies
- `tsconfig.json` - TypeScript compiler options
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.env.example` - Environment variables template

### Documentation

- `README.md` - Project overview and quick start
- `DEVELOPMENT.md` - Development guidelines
- `ARCHITECTURE.md` - Technical architecture
- `PROJECTS.md` - Project context and requirements
- `PROJECT_STRUCTURE.md` - This file

## Naming Conventions

### Files and Folders

- Use **kebab-case** for files and folders
- Example: `user-service.ts`, `api-routes/`

### Code

- **Classes/Interfaces**: PascalCase (e.g., `UserService`)
- **Functions/Variables**: camelCase (e.g., `getUserById()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

## Import Paths

Use path aliases for cleaner imports:

```typescript
// Instead of:
import { User } from '../../../packages/shared/src/types';

// Use:
import { User } from '@shared/types';
```

Path aliases are configured in `tsconfig.json` and each package's `tsconfig.json`.

## Adding New Features

1. Identify the domain (e.g., "products")
2. Create domain folder in backend: `apps/backend/src/products/`
3. Create frontend features: `apps/frontend/src/app/products/`
4. Add shared types: `packages/shared/src/types/products.ts`
5. Create UI components if needed: `packages/ui/src/components/Product*/`
6. Update Prisma schema: `packages/database/prisma/schema.prisma`
7. Create migrations: `pnpm -r run db:migrate`

## Monorepo Commands

```bash
# Install all dependencies
pnpm install

# Run dev in all packages (parallel)
pnpm -r --parallel run dev

# Build all packages
pnpm -r run build

# Lint all packages
pnpm -r run lint

# Format all packages
pnpm -r run format

# Type check all packages
pnpm -r run type-check

# Run command in specific package
pnpm --filter @bandit/backend dev
pnpm --filter @bandit/frontend build
```

## Troubleshooting

See [DEVELOPMENT.md](DEVELOPMENT.md#troubleshooting) for common issues.
