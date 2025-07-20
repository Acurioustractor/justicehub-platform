# Queensland Youth Justice Tracker

> Last deployed: June 16, 2025

A transparent, real-time dashboard tracking Queensland's youth justice spending and outcomes. This project aims to bring transparency to public spending and highlight the disparity between detention costs ($857/day) and community programs ($41/day).

## Live Dashboard

Visit [qld-youth-justice.vercel.app](https://qld-youth-justice.vercel.app) to see the live dashboard.

## Key Features

- **Real-time Budget Tracking**: Displays current youth justice budget allocations
- **Cost Comparisons**: Shows the stark difference between detention ($857/day) and community programs ($41/day)
- **Indigenous Overrepresentation**: Highlights the 22-33x overrepresentation of Indigenous youth in detention
- **Hidden Family Costs**: Calculates the financial burden on families with youth in detention
- **Transparency Scorecard**: Rates government transparency on youth justice data
- **Automated Data Collection**: GitHub Actions automatically scrape government websites daily

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Data Collection**: Node.js scrapers running on GitHub Actions
- **Charts**: Chart.js with react-chartjs-2

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Vercel account (for deployment)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/qld-youth-justice-tracker.git
cd qld-youth-justice-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up the database:
   - Create a new Supabase project
   - Run the migration script in `supabase/migrations/001_initial_schema.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Set up GitHub Actions

1. Add secrets to your GitHub repository:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

2. The scrapers will run automatically on schedule:
   - Budget scraper: Daily at 2 AM Brisbane time
   - Parliament scraper: Daily at 3 AM Brisbane time

## Data Sources

- Queensland Budget Papers (budget.qld.gov.au)
- Queensland Parliament Hansard and Questions on Notice
- Department of Youth Justice reports
- Public committee reports

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.tsx          # Main dashboard page
│   └── layout.tsx        # Root layout
├── components/            # React components
├── lib/                   # Utility functions
│   └── supabase/         # Supabase client
├── scripts/              # Data collection scripts
│   └── scrapers/         # Web scrapers
├── supabase/             # Database migrations
└── .github/workflows/    # GitHub Actions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

This project aims to promote transparency in government spending and advocate for evidence-based youth justice policies that prioritize community-based interventions over detention.

### View Dashboard

**Option 1: Streamlit Dashboard (Full Features)**
```bash
python run_dashboard.py
# Open browser to http://localhost:8501
```

**Option 2: Flask Real-time Dashboard (Live Updates)**
```bash
python run_flask_dashboard.py
# Open browser to http://localhost:5000
```

### Generate Report
```bash
python generate_report.py
```

### Schedule Automated Tasks

**Option 1: Run Full Automation System**
```bash
python run_automation.py
```
This runs:
- Daily scrapers at 9 AM
- Weekly PDF reports on Mondays
- Email alerts for new documents
- Auto-generation of RTI requests

**Option 2: Simple Scheduler (Legacy)**
```bash
python scheduler.py
```

### Docker Deployment
```bash
# Build and run all services
docker-compose up -d

# Run only the automation system
docker-compose up scheduler
```

### Cloud Deployment (GitHub Actions)
The repository includes GitHub Actions workflows for:
- Daily automated scraping at 9 AM Brisbane time
- Weekly report generation on Mondays
- Automatic deployment to cloud platforms
- Email notifications for new findings

Set these secrets in your GitHub repository:
- `SMTP_SERVER`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `ALERT_EMAIL_TO`, `REPORT_EMAIL_TO`
- Cloud deployment credentials (GCP_PROJECT, etc.)

## Dashboard Features

### Overview Page
- Current spending split visualization
- Daily cost comparisons
- Key metrics display

### Cost Analysis
- Cost per successful outcome
- 5-year savings projections
- Program effectiveness comparison

### Indigenous Disparities
- Overrepresentation statistics
- Facility-level breakdowns
- Population vs detention rates

### Alternative Scenarios
- Budget reallocation modeling
- Capacity increase calculations
- Service day projections

### Parliamentary Activity
- Recent document tracking
- Topic analysis
- Timeline visualization

### RTI Templates
- Pre-written request templates
- Submission guidelines
- Department contact information

## Data Sources

- Queensland Budget Papers
- Parliament of Queensland Hansard
- Committee Reports
- Questions on Notice

## Key Statistics

- **Detention Cost**: $857/day per youth
- **Community Cost**: $41/day per youth
- **Cost Ratio**: 20.9:1
- **Current Split**: 90.6% detention, 9.4% community
- **Indigenous Detention**: 66% (vs 6% of population)
- **Overrepresentation**: 22x higher than population rate

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Disclaimer

This tool aggregates publicly available data for transparency and advocacy purposes. All data is sourced from official government websites and documents.

## Contact

For questions or suggestions, please open an issue on GitHub.