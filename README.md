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
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/RWMonrad/custonic.git
cd custonic

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set up your Supabase project and update .env.local
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Dependency Policy

**⚠️ Important: No legacy-peer-deps**

- Never use `--force` or `--legacy-peer-deps` when installing dependencies
- Always commit `package-lock.json` to ensure reproducible builds
- If you encounter ERESOLVE errors, fix the underlying dependency conflict rather than bypassing it

### Quick Start

1. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/              # Next.js App Router
├── components/       # Reusable UI components
├── lib/             # Utility functions and configurations
├── types/           # TypeScript type definitions
└── styles/          # Global styles
```

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

_Document prepared February 25, 2026 | Monrad Ruzt Technology_
