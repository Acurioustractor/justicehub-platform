# AI Scraper Module

Intelligent organizational data discovery and extraction system for JusticeHub.

## Overview

The AI Scraper module provides comprehensive organizational profile data by intelligently discovering, extracting, validating, and maintaining information about youth justice services, community organizations, and support programs.

## Features

- **Multi-Source Data Discovery**: Government databases, NGO registries, community directories
- **AI-Powered Content Extraction**: Uses GPT-4/Claude for intelligent data analysis
- **Quality Assurance**: Automated validation and human-in-the-loop verification
- **Real-Time Monitoring**: Continuous data freshness and accuracy tracking
- **Semantic Understanding**: Context-aware categorization and relationship detection

## Architecture

```
src/modules/ai-scraper/
├── core/                    # Core scraping engine
├── sources/                 # Source-specific extractors
├── processors/              # AI processing pipeline
├── validators/              # Data quality assurance
├── database/               # Schema and migrations
├── api/                    # REST API endpoints
├── types/                  # TypeScript definitions
└── utils/                  # Helper functions
```

## Integration

- **Youth Justice Service Finder**: Enhances existing service data
- **QLD Justice Tracker**: Adds organizational context to budget data
- **Main JusticeHub**: Provides comprehensive organizational profiles

## Configuration

Environment variables for AI services, scraping infrastructure, and quality controls are managed through the main JusticeHub `.env.local` configuration.

## Development

1. Set up environment variables for AI services (OpenAI, Anthropic, Firecrawl)
2. Run database migrations for scraper-specific tables
3. Start scraper workers with `npm run scraper:dev`
4. Monitor progress through admin dashboard

## Data Sources

- Australian Government Open Data Portal
- ACNC Charity Register
- State and Territory Service Directories
- Legal Aid Directories
- Indigenous Organization Databases
- University Community Program Directories