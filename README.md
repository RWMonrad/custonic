
# Custonic - Contract Monitoring Platform

## Overview

Custonic is a B2B SaaS platform for contract monitoring and analysis.
It's part of a comprehensive suite that follows the narrative:

### Platform Narrative

Create proposals (QA) → Monitor contracts (Custonic) →
Negotiate better terms (VNA) → Predict churn (RL)

## Tech Stack

- **Frontend**: Next.js 15.1.6 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Features

- Contract monitoring and tracking
- Real-time contract analytics
- Automated alerts and notifications
- Contract lifecycle management
- Integration with proposal systems

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Environment variables configured

### Environment Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

1. Configure your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

### Installation

```bash
npm install
```

### Database Setup

#### Step 1: Run RLS Core Pack

Execute the RLS setup script in Supabase SQL Editor:

```sql
-- Copy the contents of scripts/setup/M2_RLS_Core_Pack.sql
-- and run it in your Supabase SQL Editor
```

This script:

- Enables RLS on all tables
- Creates helper functions for org membership checks
- Sets up policies for users, organizations, org_members
- Creates secure RPC function for org creation
- Automatically applies org-scoped policies to future tables

#### Step 2: Test RLS with Smoke Test

Run the smoke test to verify RLS is working correctly:

```bash
# Add test users to .env.local (do not commit):
# TEST_ALICE_EMAIL=alice+custonic@yourdomain.com
# TEST_ALICE_PASS=alice_password
# TEST_BOB_EMAIL=bob+custonic@yourdomain.com
# TEST_BOB_PASS=bob_password

node scripts/rls-smoketest.mjs
```

Or use the npm script:

```bash
npm run test:rls
```

Expected results:

- Alice cannot see Bob's organization
- Alice cannot insert into Bob's organization
- Users can only access their own data
- Cross-org operations fail with policy errors

#### Step 3: Test Storage Security

Verify storage RLS policies block invalid files:

```bash
npm run test:storage-rls
```

Expected results:

- Alice cannot see Bob's organization
- Alice cannot insert into Bob's organization
- Users can only access their own data
- Cross-org operations fail with policy errors
- Invalid MIME types blocked by storage policy
- File size limits enforced at storage level

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Type Check

```bash
npm run typecheck  # TypeScript compilation
npm run build      # Production build
npm run gate       # Full CI pipeline (typecheck + lint + build)
```

### TypeScript Cache Issues

If you see red import errors in IDE but TypeScript compilation passes:

```bash
# Restart TypeScript server
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Reopen workspace
# Close and reopen the project folder

# Nuclear option (if needed)
rm -rf .next node_modules
npm install
```

This resolves IDE cache issues where imports show as errors but actually work.

## Project Structure

```text
src/
├── app/              # Next.js App Router
├── components/       # Reusable UI components
├── shared/           # Shared utilities and configurations
│   ├── db/          # Database schemas and queries
│   ├── lib/         # Utility functions
│   └── i18n/        # Internationalization
├── scripts/         # Database setup scripts
└── types/           # TypeScript type definitions
```

## Security

### Row Level Security (RLS)

This application implements database-level security using Supabase RLS:

- Users can only access their own data
- Organizations are scoped to member access
- All operations go through security policies
- Atomic operations use secure RPC functions

See `scripts/setup/` for complete RLS implementation.

### Dependency Policy

Important: No legacy-peer-deps

- Never use `--force` or `--legacy-peer-deps` when installing
  dependencies
- Always commit `package-lock.json` to ensure reproducible builds
- If you encounter ERESOLVE errors, fix the underlying dependency
  conflict rather than bypassing it

### Documentation Standards

This project follows consistent documentation patterns:

- Important: Use for critical information that requires attention
- Warning: Use for potential issues or breaking changes

Note: Avoid emojis at paragraph start and standalone bold lines to
prevent markdown linting issues.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Rune W. Monrad - [@rune](https://github.com/RWMonrad)

---

Document prepared March 1, 2026 | Monrad Ruzt Technology
