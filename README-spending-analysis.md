# Youth Justice Spending Analysis System

A comprehensive data analysis system to track and analyze youth justice spending over time using historical documents and payment data from Queensland Department of Youth Justice, Victoria and Sport (DYJVS).

## Overview

This system automatically:
- 🔍 Collects historical payment data from Queensland Government sources
- 📊 Analyzes spending trends over time
- 🎯 Categorizes services and identifies spending patterns
- 🚨 Detects anomalies and outliers
- 📈 Creates visualizations and comprehensive reports

## Quick Start

Run the complete analysis with one command:

```bash
cd "/Users/benknight/Code/Youth Justice Service Finder"
python3 scripts/run-spending-analysis.py
```

This will:
1. Install required packages
2. Collect historical data
3. Perform analysis
4. Generate reports and visualizations

## Data Sources

The system collects data from:

### 📋 Payment Data
- **Current DYJVS On-time Payments** (2024-25): Live CSV data
- **Historical DCYJMA Consultancies** (2020-22): Consultancy spending
- **Youth Justice Consultancies** (2019-20): Department consultancy data

### 📄 Annual Reports
- Youth Justice Annual Reports (2020-2024)
- Financial statements and performance data
- Service delivery statistics

### 🏛️ Government Sources
- Queensland Government Open Data Portal
- Department of Youth Justice publications
- Official financial reporting documents

## Analysis Features

### 🔍 Spending Trends
- **Yearly Analysis**: Total spending, payment counts, averages
- **Seasonal Patterns**: Monthly and quarterly spending patterns
- **Growth Trends**: Year-over-year spending changes

### 🎯 Service Categorization
Automatically categorizes services into:
- **Detention Services**: Custody, secure facilities, youth justice centres
- **Community Services**: Supervision, probation, community orders
- **Support Services**: Counselling, mental health, family support
- **Legal Services**: Legal aid, court representation, advocacy
- **Education Services**: Training, vocational programs, skills development
- **Health Services**: Medical, psychological, therapy services
- **Administration**: Management, overhead, corporate functions

### 📊 Supplier Analysis
- Top suppliers by spending volume
- Supplier concentration analysis
- Payment frequency patterns
- Risk assessment for high-value suppliers

### 🚨 Anomaly Detection
- **Statistical Outliers**: Payments outside normal ranges
- **Large Payments**: 99th percentile threshold analysis
- **Payment Delays**: Late payment identification
- **Unusual Patterns**: Seasonal or supplier anomalies

## Output Files

### 📈 Visualizations
- `yearly_trends.png`: Spending and payment count trends
- `category_analysis.png`: Service category breakdowns
- `top_suppliers.png`: Major supplier spending
- `monthly_patterns.png`: Seasonal spending patterns

### 📄 Reports
- `spending_report_[timestamp].txt`: Comprehensive text report
- `complete_analysis_[timestamp].json`: Full analysis data
- `spending_analysis_[timestamp].json`: Summary statistics

### 📋 Data Files
- `processed_[dataset]_[timestamp].csv`: Cleaned and categorized data
- Raw CSV downloads from government sources
- Combined datasets for further analysis

## Key Insights Available

### 💰 Financial Analysis
- Total spending across all categories
- Average payment sizes by service type
- Spending distribution and concentration
- Budget allocation effectiveness

### 📅 Temporal Analysis
- Spending trends over multiple years
- Seasonal spending patterns
- Payment processing efficiency
- Budget cycle analysis

### 🏢 Operational Analysis
- Service provider performance
- Cost per service type
- Geographic spending distribution
- Program effectiveness metrics

## Advanced Usage

### Individual Scripts

1. **Data Collection Only**:
   ```bash
   python3 scripts/historical-data-collector.py
   ```

2. **Analysis Only** (requires existing data):
   ```bash
   python3 scripts/spending-analyzer.py
   ```

### Custom Analysis
- Modify service categories in `historical-data-collector.py`
- Adjust anomaly detection thresholds in `spending-analyzer.py`
- Add new data sources to the `data_sources` dictionary

## Requirements

- Python 3.7+
- pandas
- matplotlib
- seaborn
- requests
- numpy

All requirements are automatically installed by the main script.

## Data Privacy & Compliance

- ✅ Uses only publicly available government data
- ✅ No personal or sensitive information processed
- ✅ Complies with Queensland Government Open Data License
- ✅ Proper attribution to data sources maintained

## Output Examples

### Sample Analysis Results
```
YOUTH JUSTICE SPENDING ANALYSIS COMPLETE
========================================

Total Records Analyzed: 15,247
Total Spending: $45,623,891.50
Average Payment: $2,992.45

YEARLY SPENDING TRENDS:
2024: $12,456,789.00 (4,123 payments)
2023: $11,234,567.00 (3,892 payments)
2022: $10,987,654.00 (3,654 payments)

TOP SERVICE CATEGORIES:
detention_services: $18,245,678.00 (40.0%)
community_services: $9,123,456.00 (20.0%)
support_services: $7,234,567.00 (15.9%)
```

### Anomaly Detection
- Statistical outliers: 156 payments (1.2%)
- Large payments >$50,000: 23 instances
- Payment delays >90 days: 45 cases

## Troubleshooting

### Common Issues
1. **Network errors**: Check internet connection for data downloads
2. **Permission errors**: Ensure write access to output directory
3. **Missing packages**: Run `pip install -r requirements.txt`

### Data Issues
1. **Empty datasets**: Some historical years may have limited data
2. **Format changes**: Government data formats may change over time
3. **URL updates**: Data source URLs may need periodic updates

## Contributing

To add new data sources:
1. Update `data_sources` dictionary in `historical-data-collector.py`
2. Add appropriate parsing logic for new data formats
3. Update service categorization if needed

## Future Enhancements

- 🔄 Automated monthly data collection
- 🌐 Web dashboard for interactive analysis
- 📧 Alert system for spending anomalies
- 🔗 Integration with budget planning systems
- 📊 Predictive spending models

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review log files for detailed error messages
3. Ensure all data sources are accessible
4. Verify Python package versions

---

**Generated by Youth Justice Service Finder Analysis System**  
*Analyzing spending patterns to improve youth justice outcomes*