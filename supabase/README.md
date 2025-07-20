# Supabase Integration for Queensland Youth Justice Tracker

This directory contains the Supabase configuration and migrations for the Queensland Youth Justice Tracker project.

## Overview

The project uses Supabase as a cloud database to store and serve youth justice data. This enables:

- **Cloud Storage**: Data is stored securely in the cloud
- **Real-time Updates**: Dashboard can show live data as it's scraped
- **Public API**: Data is accessible via REST APIs
- **Scalability**: Can handle large amounts of data and concurrent users
- **Row Level Security**: Fine-grained access control

## Database Schema

The database includes the following main tables:

### Core Data Tables
- `budget_allocations` - Government budget allocations for youth justice programs
- `expenditures` - Actual spending on youth justice facilities and programs
- `youth_statistics` - Statistics on youth in detention and community programs
- `cost_comparisons` - Comparisons between detention and community program costs

### Document Tables
- `parliamentary_documents` - Hansard records and parliamentary questions
- `reports` - Generated reports and analyses
- `rti_requests` - Right to Information requests and responses

### Analysis Tables
- `hidden_costs` - Hidden costs borne by families and communities
- `family_cost_calculations` - Detailed calculations of family costs
- `media_citations` - Media coverage and citations
- `policy_changes` - Tracked policy changes
- `impact_metrics` - Metrics tracking advocacy impact

### Community Tables
- `coalition_members` - Coalition member organizations
- `coalition_actions` - Actions taken by coalition members
- `shared_documents` - Documents shared within the coalition
- `events` - Community events and meetings

### Interview Tables
- `interview_templates` - Templates for conducting interviews
- `interviews` - Interview records
- `interview_responses` - Individual interview responses
- `interview_themes` - Themes identified from interviews

## Setup Instructions

See [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) for detailed setup instructions.

## Quick Start

1. Create a Supabase project at https://supabase.com
2. Run the migration in `migrations/001_initial_schema.sql`
3. Add environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```
4. Install dependencies and run the project

## API Endpoints

The following REST API endpoints are available:

- `GET /api/budget-allocations` - Budget allocation data
- `GET /api/youth-statistics` - Youth statistics
- `GET /api/cost-comparisons` - Cost comparison data
- `GET /api/hidden-costs` - Hidden costs and family calculations
- `GET /api/parliamentary-documents` - Parliamentary documents

## Security

- All tables have Row Level Security (RLS) enabled
- Public read access is allowed for most tables
- Write access requires authentication (for scrapers)
- Sensitive data in `rti_requests` is restricted

## Data Flow

1. **Scrapers** collect data from government websites
2. Data is saved to both **SQLite** (local backup) and **Supabase** (cloud)
3. **API endpoints** serve data from Supabase
4. **Dashboard** displays real-time data to users

## Maintenance

- Monitor usage in Supabase dashboard
- Enable Point-in-Time Recovery for backups
- Review slow query logs monthly
- Update RLS policies as needed

## Development

To work with Supabase locally:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## Troubleshooting

Common issues and solutions:

1. **Connection errors**: Check environment variables
2. **Permission denied**: Review RLS policies
3. **Slow queries**: Add appropriate indexes
4. **Data not appearing**: Check if RLS policies allow access

For more help, see the [Supabase documentation](https://supabase.com/docs).