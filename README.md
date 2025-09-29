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

- [Production Site](https://justicehub.vercel.app)
- [GitHub Repository](https://github.com/Acurioustractor/justicehub-platform)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

Built with ❤️ for justice-impacted youth
