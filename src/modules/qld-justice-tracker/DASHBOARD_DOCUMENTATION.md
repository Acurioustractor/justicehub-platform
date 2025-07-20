# Queensland Youth Justice Tracker - Dashboard Documentation

## Overview

The Queensland Youth Justice Tracker is a professional, data-driven dashboard that displays real-time statistics from verified government sources. Every number shown is extracted from official Queensland Government PDFs with full source attribution.

## Key Statistics Currently Tracked

### From Database (Loaded from verified-statistics.json)
- **Youth Detention**: 338 youth detained, 73.4% Indigenous
- **Court Data**: 8,457 defendants, 61.9% Indigenous  
- **Budget**: $489.1M total, 90.6% on detention
- **Police**: 15,234 offenders, 58% reoffend
- **Audit**: $1.38B spent 2018-2023, no accountability

## Architecture

### 1. Data Flow
```
Government PDFs → Manual Verification → Database → API Endpoints → React Components → User
```

### 2. API Endpoints

#### `/api/dashboard`
- Returns all current statistics with sources
- Calculates derived metrics (overrepresentation, daily costs)
- Includes last updated timestamps

#### `/api/trends`  
- Historical data for charts
- Trend analysis (increasing/decreasing/stable)
- Period comparisons

#### `/api/sources`
- Complete source documentation
- Page references for every statistic
- Update schedules and verification methods

### 3. Key Components

#### `UnifiedDashboard.tsx`
- Main dashboard combining all features
- Real-time money counter
- Evidence section with source links
- Action calls-to-action

#### `HeadlineMetrics.tsx`
- Four key metrics with live updates
- Uses real data from `useDashboardData` hook
- Source badges for credibility

#### `ShareTools.tsx`
- Pre-written messages with verified stats
- Platform-specific formatting
- Copy and share functionality

#### `ContactMP.tsx`
- MP finder by postcode
- Email templates with local data
- Follow-up guidance

#### `ImpactCalculator.tsx`
- Personalized community impact
- Shows what money could fund instead
- Comparison with successful programs

#### `DownloadCenter.tsx`
- Export data in multiple formats
- PDF fact sheets
- Raw data for researchers

## Data Sources

### Primary Sources
1. **Children's Court Annual Report 2023-24**
   - Total defendants: 8,457 (p.15)
   - Indigenous: 61.9% (p.18-19)
   - Bail refused: 25.4% (p.22)

2. **Youth Detention Census Q1 2024**
   - Total youth: 338
   - Indigenous: 73.4%
   - On remand: 68.3%
   - Capacity: 107%

3. **Queensland Budget 2024-25**
   - Total: $489.1M (p.78)
   - Detention: 90.6% (p.78-82)
   - Community: 7.6% (p.78-82)

4. **QPS Statistical Review 2023-24**
   - Youth offenders: 15,234 (p.47)
   - Repeat rate: 58% (p.47)

5. **QAO Report 2024**
   - Total spent: $1.38B (2018-2023)
   - True cost: $1,570/day
   - Finding: "No single entity accountable"

## Features

### Real-Time Updates
- Money counter updates every second
- Data refreshes every 30 seconds via SWR
- WebSocket support planned

### Mobile Optimization
- Responsive design
- Touch-friendly interactions
- Bottom navigation bar
- Service worker for offline access

### Accessibility
- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- High contrast mode ready

### Performance
- Lazy loading components
- Image optimization
- Code splitting
- PWA with offline support

## Usage

### For Developers
```bash
# Start development server
npm run dev

# Access endpoints
GET /api/dashboard - Full statistics
GET /api/trends - Historical data  
GET /api/sources - Source documentation
```

### For Content Editors
- Update data in `/data/verified-statistics.json`
- Run data loader script to update database
- Changes appear immediately on dashboard

### For Users
1. **View Dashboard**: Real-time statistics with sources
2. **Take Action**: Share, contact MP, download data
3. **Calculate Impact**: See local community effects
4. **Verify Sources**: Every stat links to government PDF

## Maintenance

### Weekly Tasks
- Check for new government reports
- Update statistics if new data available
- Verify all source URLs still work
- Review user feedback

### Monthly Tasks
- Full data audit
- Performance review
- Accessibility testing
- Update documentation

## Success Metrics

### Technical
- <3s page load time
- 95+ Lighthouse score
- Zero accessibility errors
- 99.9% uptime

### Impact
- Media citations of our data
- MP responses to constituents
- Downloads of evidence packs
- Social media shares

## Future Enhancements

1. **Automated PDF Extraction**
   - OCR for scanned documents
   - ML-based stat extraction
   - Automatic verification

2. **Real-Time Alerts**
   - New report notifications
   - Significant stat changes
   - MP response tracking

3. **Enhanced Visualizations**
   - Interactive charts
   - Geographic heat maps
   - Trend predictions

4. **Community Features**
   - User stories
   - Local impact reports
   - Campaign coordination

## Troubleshooting

### Common Issues

1. **"No data found"**
   - Check database connection
   - Verify RLS policies
   - Run data loader script

2. **Slow loading**
   - Check API response times
   - Review database queries
   - Enable caching

3. **Source links broken**
   - Government may have moved PDFs
   - Update URLs in database
   - Archive PDFs locally

## Contact

For questions or contributions:
- GitHub Issues: Report bugs or suggest features
- Pull Requests: Welcome with tests
- Documentation: Keep this file updated

Remember: Every statistic must be verifiable from official Queensland Government sources. No exceptions.