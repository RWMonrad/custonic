# Custonic - Contract Monitoring Platform

## Overview

Custonic is a B2B SaaS platform for contract monitoring and analysis. It's part of a comprehensive suite that follows the narrative:

**Create proposals (QA) → Monitor contracts (Custonic) → Negotiate better terms (VNA) → Predict churn (RL)**

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
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/RWMonrad/custonic.git
cd custonic
```

1. Install dependencies:

```bash
npm install
```

1. Set up environment variables:

```bash
cp .env.example .env.local
```

1. Configure your Supabase project in `.env.local`

2. Run the development server:

```bash
npm run dev
```

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
