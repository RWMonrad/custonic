# Custonic - Contract Monitoring Platform

## Overview

Custonic is a B2B SaaS platform for contract monitoring and analysis. It's part of a comprehensive suite that follows the narrative:

### Platform Narrative

Create proposals (QA) → Monitor contracts (Custonic) → Negotiate better terms (VNA) → Predict churn (RL)

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

#### Step 1: Run RLS Setup

Execute the RLS setup script in Supabase SQL Editor:

```sql
-- Copy the contents of scripts/setup/setup_rls.sql
-- and run it in your Supabase SQL Editor
```

#### Step 2: Verify RLS


```sql
-- Copy the contents of scripts/verify_rls.sql
-- and run it in your Supabase SQL Editor
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Type Check

```bash
npm run typecheck  # TypeScript compilation
npm run build      # Production build
```

## Project Structure

```
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

- **Users** can only access their own data
- **Organizations** are scoped to member access
- **All operations** go through security policies
- **Atomic operations** use secure RPC functions

See `scripts/setup/` for complete RLS implementation.

### Dependency Policy

**Important:** No legacy-peer-deps

- Never use `--force` or `--legacy-peer-deps` when installing dependencies
- Always commit `package-lock.json` to ensure reproducible builds
- If you encounter ERESOLVE errors, fix the underlying dependency conflict rather than bypassing it

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Rune W. Monrad - [@rune](https://github.com/RWMonrad)

---

_Document prepared March 1, 2026 | Monrad Ruzt Technology_
