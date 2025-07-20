# JusticeHub Platform

A digital platform that bridges the gap between young people's life experiences and opportunities for growth, mentorship, and economic advancement.

## Features

- **Living Libraries**: A unified story management system that combines new user-created stories with existing stories from Airtable
- **Mentor Hub**: Connect youth with experienced mentors for guidance and support
- **Opportunity Matching**: Connect youth with relevant apprenticeships, jobs, and growth opportunities
- **Empathy Ledger**: Analytics dashboard to help organizations understand their impact

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Integration**: Airtable API for existing story collections

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Airtable account (optional, for integration)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/justicehub.git
cd justicehub
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

- Create a new Supabase project
- Run the migration in `supabase/migrations/20230701000000_initial_schema.sql`
- Create storage buckets:
  - `profile-images` (public)
  - `story-media` (private)
  - `organization-assets` (public)
  - `consent-documents` (private)

4. **Configure environment variables**

Create a `.env.local` file with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
justicehub/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth-related routes
│   │   ├── (dashboard)/          # Dashboard routes
│   │   ├── stories/              # Story routes
│   │   └── opportunities/        # Opportunity routes
│   ├── components/               # React components
│   ├── lib/                      # Utility libraries
│   │   ├── supabase/             # Supabase client & helpers
│   │   └── airtable/             # Airtable integration
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   └── seed/                     # Seed data
└── public/                       # Static assets
```

## Development Workflow

1. **Database Schema Changes**

When making changes to the database schema:

```bash
# Create a new migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Apply migrations locally
npx supabase db push
```

2. **Supabase Type Generation**

After schema changes, update TypeScript types:

```bash
npm run supabase:types
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

### Supabase Setup

1. Create a production Supabase project
2. Run migrations
3. Configure storage buckets
4. Set up authentication providers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Airtable](https://airtable.com/)