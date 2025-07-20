#!/usr/bin/env python3
"""
Youth Justice Spending Analyzer
Advanced analysis and visualization of historical spending data
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import datetime
from typing import Dict, List, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpendingAnalyzer:
    def __init__(self, data_dir: str = "historical_data"):
        self.data_dir = Path(data_dir)
        self.analysis_dir = self.data_dir / "analysis"
        self.analysis_dir.mkdir(exist_ok=True)
        
        # Set up plotting style
        plt.style.use('seaborn-v0_8-darkgrid')
        sns.set_palette("husl")

    def load_processed_data(self) -> pd.DataFrame:
        """Load all processed CSV files into a single DataFrame"""
        all_data = []
        
        for csv_file in self.data_dir.glob("processed_*.csv"):
            try:
                df = pd.read_csv(csv_file)
                df['source_file'] = csv_file.name
                all_data.append(df)
                logger.info(f"Loaded {len(df)} records from {csv_file.name}")
            except Exception as e:
                logger.error(f"Failed to load {csv_file}: {e}")
        
        if not all_data:
            raise ValueError("No processed data files found")
        
        combined_df = pd.concat(all_data, ignore_index=True)
        
        # Ensure proper data types
        if 'amount' in combined_df.columns:
            combined_df['amount'] = pd.to_numeric(combined_df['amount'], errors='coerce')
        
        date_columns = ['invoice_date', 'payment_date']
        for col in date_columns:
            if col in combined_df.columns:
                combined_df[col] = pd.to_datetime(combined_df[col], errors='coerce')
        
        logger.info(f"Combined dataset: {len(combined_df)} total records")
        return combined_df

    def analyze_spending_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive spending trend analysis"""
        analysis = {}
        
        # Time-based analysis
        if 'invoice_date' in df.columns and 'amount' in df.columns:
            df_time = df.dropna(subset=['invoice_date', 'amount'])
            df_time['year'] = df_time['invoice_date'].dt.year
            df_time['month'] = df_time['invoice_date'].dt.month
            df_time['quarter'] = df_time['invoice_date'].dt.quarter
            
            # Yearly trends
            yearly_spending = df_time.groupby('year')['amount'].agg(['sum', 'count', 'mean']).round(2)
            analysis['yearly_trends'] = yearly_spending.to_dict('index')
            
            # Monthly patterns
            monthly_avg = df_time.groupby('month')['amount'].mean().round(2)
            analysis['monthly_patterns'] = monthly_avg.to_dict()
            
            # Quarterly analysis
            quarterly_spending = df_time.groupby(['year', 'quarter'])['amount'].sum().round(2)
            analysis['quarterly_trends'] = quarterly_spending.to_dict()
        
        # Service category analysis
        if 'service_category' in df.columns and 'amount' in df.columns:
            category_analysis = df.groupby('service_category')['amount'].agg([
                'sum', 'count', 'mean', 'median', 'std'
            ]).round(2)
            analysis['category_analysis'] = category_analysis.to_dict('index')
        
        # Supplier analysis
        if 'supplier_name' in df.columns and 'amount' in df.columns:
            supplier_stats = df.groupby('supplier_name')['amount'].agg([
                'sum', 'count', 'mean'
            ]).round(2)
            
            # Top suppliers by total spending
            top_suppliers = supplier_stats.nlargest(20, 'sum')
            analysis['top_suppliers'] = top_suppliers.to_dict('index')
            
            # Supplier concentration analysis
            total_spending = df['amount'].sum()
            top_10_spending = supplier_stats.nlargest(10, 'sum')['sum'].sum()
            analysis['supplier_concentration'] = {
                'top_10_percentage': round((top_10_spending / total_spending) * 100, 2),
                'total_suppliers': len(supplier_stats),
                'total_spending': total_spending
            }
        
        return analysis

    def detect_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect spending anomalies and outliers"""
        anomalies = {}
        
        if 'amount' in df.columns:
            amounts = df['amount'].dropna()
            
            # Statistical outliers (IQR method)
            Q1 = amounts.quantile(0.25)
            Q3 = amounts.quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = df[(df['amount'] < lower_bound) | (df['amount'] > upper_bound)]
            
            anomalies['statistical_outliers'] = {
                'count': len(outliers),
                'percentage': round((len(outliers) / len(df)) * 100, 2),
                'high_value_threshold': upper_bound,
                'low_value_threshold': lower_bound
            }
            
            # Large payments (top 1%)
            high_threshold = amounts.quantile(0.99)
            large_payments = df[df['amount'] > high_threshold]
            
            anomalies['large_payments'] = {
                'threshold': high_threshold,
                'count': len(large_payments),
                'total_value': large_payments['amount'].sum(),
                'examples': large_payments.nlargest(5, 'amount')[['supplier_name', 'amount', 'description']].to_dict('records') if len(large_payments) > 0 else []
            }
        
        # Timing anomalies
        if 'invoice_date' in df.columns and 'payment_date' in df.columns:
            df_dates = df.dropna(subset=['invoice_date', 'payment_date'])
            df_dates['payment_delay'] = (df_dates['payment_date'] - df_dates['invoice_date']).dt.days
            
            # Very long payment delays
            long_delays = df_dates[df_dates['payment_delay'] > 90]  # More than 3 months
            
            anomalies['payment_delays'] = {
                'long_delay_count': len(long_delays),
                'average_delay': df_dates['payment_delay'].mean(),
                'max_delay': df_dates['payment_delay'].max(),
                'examples': long_delays.nlargest(5, 'payment_delay')[['supplier_name', 'payment_delay', 'amount']].to_dict('records') if len(long_delays) > 0 else []
            }
        
        return anomalies

    def create_visualizations(self, df: pd.DataFrame, analysis: Dict[str, Any]):
        """Create comprehensive spending visualizations"""
        fig_dir = self.analysis_dir / "figures"
        fig_dir.mkdir(exist_ok=True)
        
        # 1. Yearly spending trends
        if 'yearly_trends' in analysis:
            plt.figure(figsize=(12, 6))
            years = list(analysis['yearly_trends'].keys())
            spending = [analysis['yearly_trends'][year]['sum'] for year in years]
            
            plt.subplot(1, 2, 1)
            plt.plot(years, spending, marker='o', linewidth=2, markersize=8)
            plt.title('Total Spending by Year')
            plt.xlabel('Year')
            plt.ylabel('Total Spending ($)')
            plt.xticks(rotation=45)
            plt.grid(True, alpha=0.3)
            
            # Format y-axis as currency
            plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
            
            # Payment count by year
            counts = [analysis['yearly_trends'][year]['count'] for year in years]
            plt.subplot(1, 2, 2)
            plt.bar(years, counts, alpha=0.7)
            plt.title('Number of Payments by Year')
            plt.xlabel('Year')
            plt.ylabel('Number of Payments')
            plt.xticks(rotation=45)
            
            plt.tight_layout()
            plt.savefig(fig_dir / 'yearly_trends.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 2. Service category breakdown
        if 'category_analysis' in analysis:
            plt.figure(figsize=(15, 10))
            
            categories = list(analysis['category_analysis'].keys())
            spending = [analysis['category_analysis'][cat]['sum'] for cat in categories]
            counts = [analysis['category_analysis'][cat]['count'] for cat in categories]
            
            # Pie chart for spending
            plt.subplot(2, 2, 1)
            plt.pie(spending, labels=categories, autopct='%1.1f%%', startangle=90)
            plt.title('Spending Distribution by Service Category')
            
            # Bar chart for counts
            plt.subplot(2, 2, 2)
            plt.barh(categories, counts)
            plt.title('Number of Payments by Category')
            plt.xlabel('Number of Payments')
            
            # Average payment size
            avg_payments = [analysis['category_analysis'][cat]['mean'] for cat in categories]
            plt.subplot(2, 2, 3)
            plt.barh(categories, avg_payments)
            plt.title('Average Payment Size by Category')
            plt.xlabel('Average Payment ($)')
            
            # Box plot for amount distribution
            if 'service_category' in df.columns and 'amount' in df.columns:
                plt.subplot(2, 2, 4)
                df_clean = df.dropna(subset=['service_category', 'amount'])
                sns.boxplot(data=df_clean, y='service_category', x='amount')
                plt.title('Payment Amount Distribution by Category')
                plt.xlabel('Payment Amount ($)')
                plt.xscale('log')
            
            plt.tight_layout()
            plt.savefig(fig_dir / 'category_analysis.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 3. Top suppliers analysis
        if 'top_suppliers' in analysis:
            plt.figure(figsize=(12, 8))
            
            suppliers = list(analysis['top_suppliers'].keys())[:15]  # Top 15
            supplier_spending = [analysis['top_suppliers'][s]['sum'] for s in suppliers]
            
            plt.barh(range(len(suppliers)), supplier_spending)
            plt.yticks(range(len(suppliers)), suppliers)
            plt.xlabel('Total Spending ($)')
            plt.title('Top 15 Suppliers by Total Spending')
            plt.gca().xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
            
            plt.tight_layout()
            plt.savefig(fig_dir / 'top_suppliers.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 4. Monthly spending patterns
        if 'monthly_patterns' in analysis:
            plt.figure(figsize=(10, 6))
            
            months = list(range(1, 13))
            monthly_avg = [analysis['monthly_patterns'].get(m, 0) for m in months]
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            
            plt.bar(month_names, monthly_avg)
            plt.title('Average Monthly Spending Patterns')
            plt.xlabel('Month')
            plt.ylabel('Average Spending ($)')
            plt.xticks(rotation=45)
            plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e3:.0f}K'))
            
            plt.tight_layout()
            plt.savefig(fig_dir / 'monthly_patterns.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        logger.info(f"Visualizations saved to {fig_dir}")

    def generate_report(self, df: pd.DataFrame, analysis: Dict[str, Any], anomalies: Dict[str, Any]) -> str:
        """Generate comprehensive analysis report"""
        report_lines = []
        report_lines.append("YOUTH JUSTICE SPENDING ANALYSIS REPORT")
        report_lines.append("=" * 50)
        report_lines.append(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("")
        
        # Executive Summary
        report_lines.append("EXECUTIVE SUMMARY")
        report_lines.append("-" * 20)
        total_records = len(df)
        total_amount = df['amount'].sum() if 'amount' in df.columns else 0
        date_range = f"{df['invoice_date'].min()} to {df['invoice_date'].max()}" if 'invoice_date' in df.columns else "Unknown"
        
        report_lines.append(f"Total Records Analyzed: {total_records:,}")
        report_lines.append(f"Total Spending: ${total_amount:,.2f}")
        report_lines.append(f"Average Payment: ${total_amount/total_records:,.2f}")
        report_lines.append(f"Date Range: {date_range}")
        report_lines.append("")
        
        # Yearly Trends
        if 'yearly_trends' in analysis:
            report_lines.append("YEARLY SPENDING TRENDS")
            report_lines.append("-" * 25)
            for year, data in analysis['yearly_trends'].items():
                report_lines.append(f"{year}: ${data['sum']:,.2f} ({data['count']:,} payments)")
            report_lines.append("")
        
        # Service Categories
        if 'category_analysis' in analysis:
            report_lines.append("SPENDING BY SERVICE CATEGORY")
            report_lines.append("-" * 30)
            for category, data in sorted(analysis['category_analysis'].items(), 
                                       key=lambda x: x[1]['sum'], reverse=True):
                percentage = (data['sum'] / total_amount) * 100
                report_lines.append(f"{category}: ${data['sum']:,.2f} ({percentage:.1f}%)")
            report_lines.append("")
        
        # Top Suppliers
        if 'top_suppliers' in analysis:
            report_lines.append("TOP 10 SUPPLIERS")
            report_lines.append("-" * 15)
            for supplier, data in list(analysis['top_suppliers'].items())[:10]:
                report_lines.append(f"{supplier}: ${data['sum']:,.2f}")
            report_lines.append("")
        
        # Anomalies
        if anomalies:
            report_lines.append("ANOMALIES AND OUTLIERS")
            report_lines.append("-" * 22)
            
            if 'statistical_outliers' in anomalies:
                outlier_data = anomalies['statistical_outliers']
                report_lines.append(f"Statistical Outliers: {outlier_data['count']} ({outlier_data['percentage']}%)")
            
            if 'large_payments' in anomalies:
                large_data = anomalies['large_payments']
                report_lines.append(f"Large Payments (>99th percentile): {large_data['count']}")
                report_lines.append(f"Large Payment Threshold: ${large_data['threshold']:,.2f}")
            
            if 'payment_delays' in anomalies:
                delay_data = anomalies['payment_delays']
                report_lines.append(f"Long Payment Delays (>90 days): {delay_data['long_delay_count']}")
                report_lines.append(f"Average Payment Delay: {delay_data['average_delay']:.1f} days")
            
            report_lines.append("")
        
        # Recommendations
        report_lines.append("RECOMMENDATIONS")
        report_lines.append("-" * 15)
        report_lines.append("1. Monitor large payment outliers for potential fraud or errors")
        report_lines.append("2. Investigate suppliers with unusually high spending concentrations")
        report_lines.append("3. Review seasonal spending patterns for budget planning")
        report_lines.append("4. Implement controls for payments exceeding normal thresholds")
        report_lines.append("5. Analyze service category effectiveness vs. spending")
        
        report_text = "\n".join(report_lines)
        
        # Save report
        report_file = self.analysis_dir / f"spending_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, 'w') as f:
            f.write(report_text)
        
        logger.info(f"Report saved to {report_file}")
        return report_text

    def run_complete_analysis(self) -> Dict[str, Any]:
        """Run complete spending analysis pipeline"""
        logger.info("Starting comprehensive spending analysis...")
        
        # Load data
        df = self.load_processed_data()
        
        # Perform analysis
        analysis = self.analyze_spending_trends(df)
        anomalies = self.detect_anomalies(df)
        
        # Create visualizations
        self.create_visualizations(df, analysis)
        
        # Generate report
        report = self.generate_report(df, analysis, anomalies)
        
        # Save analysis results
        results = {
            "analysis": analysis,
            "anomalies": anomalies,
            "report": report,
            "data_summary": {
                "total_records": len(df),
                "columns": list(df.columns),
                "date_range": {
                    "start": df['invoice_date'].min().isoformat() if 'invoice_date' in df.columns else None,
                    "end": df['invoice_date'].max().isoformat() if 'invoice_date' in df.columns else None
                }
            }
        }
        
        results_file = self.analysis_dir / f"complete_analysis_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info("Complete analysis finished!")
        return results

def main():
    """Main execution function"""
    analyzer = SpendingAnalyzer()
    
    try:
        results = analyzer.run_complete_analysis()
        
        print("\n" + "="*60)
        print("YOUTH JUSTICE SPENDING ANALYSIS COMPLETE")
        print("="*60)
        print(results['report'])
        
        return results
        
    except ValueError as e:
        print(f"Error: {e}")
        print("Please run historical-data-collector.py first to collect data.")
        return None

if __name__ == "__main__":
    main()