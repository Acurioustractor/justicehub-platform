# 🚀 Quick Start Guide

## Option 1: Run with Docker (Recommended)

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait about 30 seconds for services to start
docker-compose ps

# 3. Install dependencies
npm install

# 4. Copy environment file
cp .env.example .env

# 5. Set up the database
npm run setup:db

# 6. Run the demo scraper
npm run scrape:demo
```

## Option 2: Run with Existing PostgreSQL

If you already have PostgreSQL installed:

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit environment file
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Set up the database
npm run setup:db

# 4. Run the demo scraper
npm run scrape:demo
```

## What the Demo Does

The demo scraper will:
1. Create sample youth justice services if no Firecrawl API key is provided
2. With a Firecrawl API key, it will:
   - Search Ask Izzy for youth services
   - Import Queensland Open Data
   - Detect and handle duplicates
3. Show a summary of all services found

## Getting a Firecrawl API Key (Optional)

For full functionality:
1. Visit [https://firecrawl.dev](https://firecrawl.dev)
2. Sign up for a free account
3. Copy your API key
4. Add it to your `.env` file:
   ```
   FIRECRAWL_API_KEY=your_actual_api_key_here
   ```

## Troubleshooting

### PostgreSQL Connection Error
- Make sure PostgreSQL is running: `docker-compose ps`
- Check your credentials in `.env` match your setup

### Port Already in Use
- PostgreSQL (5432): `sudo lsof -i :5432` and kill the process
- Or change the port in `docker-compose.yml`

### Permission Denied
- Make sure scripts are executable: `chmod +x scripts/*.js`

## Next Steps

After running the demo:
1. Explore the database: `psql -U postgres -d youth_justice_services`
2. Check the logs for detailed information
3. Review found services in the summary output
4. Set up the API server (coming soon)