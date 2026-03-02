# JusticeHub Platform

A Next.js platform connecting system-impacted youth with support services, legal resources, and community advocates.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
justicehub-platform/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── about/        # About page
│   │   ├── contact/      # Contact form
│   │   ├── how-it-works/ # Platform overview
│   │   ├── privacy/      # Privacy policy
│   │   ├── services/     # Services directory
│   │   ├── stories/      # Story submission
│   │   ├── terms/        # Terms of service
│   │   └── youth-scout/  # Youth authentication
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── forms/       # Form components
│   ├── lib/             # Utilities and helpers
│   ├── styles/          # Global styles
│   └── content/         # Static content
├── docs/                # Documentation
│   ├── archive/         # Historical docs
│   ├── guides/          # Setup & deployment guides
│   ├── status/          # Progress reports
│   └── sql-scripts/     # Database scripts
├── public/              # Static assets
└── supabase/            # Supabase configuration

```

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.30 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Auth0 / Supabase Auth
- **Deployment**: Vercel
- **UI Components**: Radix UI, Lucide Icons

## 📚 Documentation

- [Deployment Guide](docs/guides/DEPLOYMENT_GUIDE.md)
- [Development Workflow](docs/guides/DEVELOPMENT_WORKFLOW.md)
- [Setup Guide](docs/guides/SETUP_GUIDE.md)
- [Architecture](docs/archive/JusticeHub-Technical-Architecture.md)

## 🔑 Environment Variables

Required environment variables (see `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_long_random_secret
# Optional dedicated secret for System 0 scheduler endpoint
SYSTEM0_CRON_SECRET=your_long_random_secret
```

## 🚢 Deployment

The project auto-deploys to Vercel on push to `main`:

```bash
git push origin main
```

Manual deployment:
```bash
npm run build
npm start
```

## 🤖 System 0 Autopilot

System 0 funding orchestration now uses a shared policy store for scheduler + worker + admin controls.

- Apply migrations:
  - `supabase/migrations/20260227000001_funding_system0_policy.sql`
  - `supabase/migrations/20260227000002_funding_system0_events.sql`
  - `supabase/migrations/20260227000003_funding_system0_filter_presets.sql`
  - `supabase/migrations/20260227000004_funding_system0_filter_presets_visibility.sql`
  - `supabase/migrations/20260227000005_funding_system0_filter_presets_rls.sql`
- Admin policy API: `GET/POST /api/admin/funding/system-0/policy`
- Admin scheduler tick: `POST /api/admin/funding/system-0/scheduler`
- Admin audit feed: `GET /api/admin/funding/system-0/events`
- Admin shared presets API: `GET/POST/DELETE /api/admin/funding/system-0/presets`
  - Presets can now be saved as team-shared or private-to-owner.
  - RLS enforces admin access with private-presets owner scope.
- Cron scheduler: `GET/POST /api/cron/funding/system-0` (requires `SYSTEM0_CRON_SECRET` or `CRON_SECRET`)

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Push and create a PR

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Production Site](https://justicehub-act.vercel.app)
- [GitHub Repository](https://github.com/Acurioustractor/justicehub-platform)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

Built with ❤️ for justice-impacted youth
