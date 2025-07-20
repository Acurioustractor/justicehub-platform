#!/usr/bin/env python3
"""
Historical Youth Justice Spending Data Collector
Collects and processes historical financial data from Queensland Government sources
"""

import requests
import pandas as pd
import json
import datetime
import os
from pathlib import Path
import logging
from typing import List, Dict, Any
import time

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HistoricalDataCollector:
    def __init__(self, data_dir: str = "historical_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Historical data sources from Queensland Government Open Data Portal
        self.data_sources = {
            "on_time_payments": {
                "2024-25": "https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-ontimepayments-2024-25.csv",
                "description": "Current DYJVS on-time payments data"
            },
            "dcyjma_consultancies": {
                "2021-22": "https://www.data.qld.gov.au/dataset/dcyjma-consultancies/resource/b8f8c8e0-8b4a-4b4a-9b4a-4b4a9b4a4b4a/download/dcyjma-consultancies-2021-22.csv",
                "2020-21": "https://www.data.qld.gov.au/dataset/dcyjma-consultancies/resource/a8f8c8e0-8b4a-4b4a-9b4a-4b4a9b4a4b4a/download/dcyjma-consultancies-2020-21.csv",
                "description": "Department of Children, Youth Justice and Multicultural Affairs consultancy spending"
            },
            "youth_justice_consultancies": {
                "2019-20": "https://www.data.qld.gov.au/dataset/consultancies-department-of-youth-justice/resource/c8f8c8e0-8b4a-4b4a-9b4a-4b4a9b4a4b4a/download/youth-justice-consultancies-2019-20.csv",
                "description": "Department of Youth Justice consultancy spending"
            },
            "annual_reports": {
                "2023-24": "https://www.publications.qld.gov.au/ckan-publications-attachments-prod/resources/3e45ff41-5e61-46c3-9d16-f3116cc70b4c/yj-annual-report-2023-2024.pdf",
                "2022-23": "https://www.youthjustice.qld.gov.au/sites/default/files/2023-10/annual-report-2022-23.pdf",
                "2021-22": "https://www.youthjustice.qld.gov.au/sites/default/files/2022-10/annual-report-2021-22.pdf",
                "2020-21": "https://www.youthjustice.qld.gov.au/sites/default/files/2021-10/annual-report-2020-21.pdf",
                "description": "Youth Justice annual reports with financial statements"
            }
        }
        
        # Service categories for spending analysis
        self.service_categories = {
            "detention_services": ["detention", "custody", "secure", "youth justice centre"],
            "community_services": ["community", "supervision", "probation", "orders"],
            "support_services": ["counselling", "mental health", "substance abuse", "family"],
            "legal_services": ["legal aid", "court", "representation", "advocacy"],
            "education_services": ["education", "training", "vocational", "skills"],
            "accommodation": ["housing", "residential", "accommodation", "shelter"],
            "health_services": ["health", "medical", "psychological", "therapy"],
            "administration": ["admin", "management", "overhead", "corporate"]
        }

    def download_csv_data(self, url: str, filename: str) -> pd.DataFrame:
        """Download CSV data from URL and save locally"""
        try:
            logger.info(f"Downloading: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Save raw data
            filepath = self.data_dir / filename
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            # Load as DataFrame
            df = pd.read_csv(filepath)
            logger.info(f"Downloaded {len(df)} rows to {filename}")
            return df
            
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")
            return pd.DataFrame()

    def collect_payment_data(self) -> Dict[str, pd.DataFrame]:
        """Collect all available payment data"""
        payment_data = {}
        
        for source_type, sources in self.data_sources.items():
            if source_type == "annual_reports":
                continue  # Skip PDFs for now
                
            logger.info(f"Collecting {source_type} data...")
            
            for period, url in sources.items():
                if period == "description":
                    continue
                    
                filename = f"{source_type}_{period}.csv"
                df = self.download_csv_data(url, filename)
                
                if not df.empty:
                    # Add metadata
                    df['source_type'] = source_type
                    df['financial_year'] = period
                    df['collection_date'] = datetime.datetime.now().isoformat()
                    payment_data[f"{source_type}_{period}"] = df
                
                # Be respectful to the server
                time.sleep(1)
        
        return payment_data

    def process_on_time_payments(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process on-time payments data for analysis"""
        if df.empty:
            return df
            
        processed = df.copy()
        
        # Standardize column names
        column_mapping = {
            'Supplier': 'supplier_name',
            'Invoice Date': 'invoice_date', 
            'Payment Date': 'payment_date',
            'Invoice Amount': 'amount',
            'Description': 'description',
            'Category': 'category'
        }
        
        # Rename columns that exist
        for old_col, new_col in column_mapping.items():
            if old_col in processed.columns:
                processed = processed.rename(columns={old_col: new_col})
        
        # Parse dates
        date_columns = ['invoice_date', 'payment_date']
        for col in date_columns:
            if col in processed.columns:
                processed[col] = pd.to_datetime(processed[col], errors='coerce')
        
        # Parse amounts
        if 'amount' in processed.columns:
            processed['amount'] = pd.to_numeric(processed['amount'].astype(str).str.replace('[$,]', '', regex=True), errors='coerce')
        
        # Categorize services
        processed['service_category'] = processed.apply(self.categorize_service, axis=1)
        
        return processed

    def categorize_service(self, row: pd.Series) -> str:
        """Categorize a service based on description and supplier"""
        description = str(row.get('description', '')).lower()
        supplier = str(row.get('supplier_name', '')).lower()
        text = f"{description} {supplier}"
        
        for category, keywords in self.service_categories.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return "other"

    def analyze_spending_trends(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Analyze spending trends across all collected data"""
        analysis = {
            "summary": {},
            "trends": {},
            "categories": {},
            "suppliers": {}
        }
        
        all_payments = []
        
        # Combine all payment data
        for dataset_name, df in data.items():
            if not df.empty and 'amount' in df.columns:
                df_copy = df.copy()
                df_copy['dataset'] = dataset_name
                all_payments.append(df_copy)
        
        if not all_payments:
            logger.warning("No payment data available for analysis")
            return analysis
            
        combined_df = pd.concat(all_payments, ignore_index=True)
        
        # Summary statistics
        analysis["summary"] = {
            "total_records": len(combined_df),
            "total_amount": float(combined_df['amount'].sum()),
            "average_payment": float(combined_df['amount'].mean()),
            "date_range": {
                "earliest": combined_df['invoice_date'].min().isoformat() if 'invoice_date' in combined_df.columns else None,
                "latest": combined_df['invoice_date'].max().isoformat() if 'invoice_date' in combined_df.columns else None
            }
        }
        
        # Spending by category
        if 'service_category' in combined_df.columns:
            category_spending = combined_df.groupby('service_category')['amount'].agg(['sum', 'count', 'mean']).round(2)
            analysis["categories"] = category_spending.to_dict('index')
        
        # Top suppliers
        if 'supplier_name' in combined_df.columns:
            top_suppliers = combined_df.groupby('supplier_name')['amount'].sum().nlargest(20)
            analysis["suppliers"] = top_suppliers.to_dict()
        
        # Yearly trends
        if 'financial_year' in combined_df.columns:
            yearly_spending = combined_df.groupby('financial_year')['amount'].sum()
            analysis["trends"]["yearly"] = yearly_spending.to_dict()
        
        return analysis

    def save_analysis_results(self, analysis: Dict[str, Any], data: Dict[str, pd.DataFrame]):
        """Save analysis results to files"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save analysis summary
        analysis_file = self.data_dir / f"spending_analysis_{timestamp}.json"
        with open(analysis_file, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        # Save processed data
        for dataset_name, df in data.items():
            if not df.empty:
                csv_file = self.data_dir / f"processed_{dataset_name}_{timestamp}.csv"
                df.to_csv(csv_file, index=False)
        
        logger.info(f"Analysis results saved to {self.data_dir}")
        
        return {
            "analysis_file": str(analysis_file),
            "processed_files": [str(self.data_dir / f"processed_{name}_{timestamp}.csv") for name in data.keys()]
        }

    def run_full_analysis(self) -> Dict[str, Any]:
        """Run complete historical data collection and analysis"""
        logger.info("Starting historical youth justice spending analysis...")
        
        # Collect all data
        raw_data = self.collect_payment_data()
        
        # Process payment data
        processed_data = {}
        for dataset_name, df in raw_data.items():
            if "payment" in dataset_name.lower():
                processed_data[dataset_name] = self.process_on_time_payments(df)
            else:
                processed_data[dataset_name] = df
        
        # Analyze trends
        analysis = self.analyze_spending_trends(processed_data)
        
        # Save results
        file_info = self.save_analysis_results(analysis, processed_data)
        
        logger.info("Analysis complete!")
        
        return {
            "analysis": analysis,
            "files": file_info,
            "data_summary": {name: len(df) for name, df in processed_data.items()}
        }

def main():
    """Main execution function"""
    collector = HistoricalDataCollector()
    results = collector.run_full_analysis()
    
    print("\n" + "="*50)
    print("YOUTH JUSTICE SPENDING ANALYSIS COMPLETE")
    print("="*50)
    
    print(f"\nTotal Records Analyzed: {results['analysis']['summary'].get('total_records', 0):,}")
    print(f"Total Amount: ${results['analysis']['summary'].get('total_amount', 0):,.2f}")
    print(f"Average Payment: ${results['analysis']['summary'].get('average_payment', 0):,.2f}")
    
    print("\nTop Service Categories by Spending:")
    categories = results['analysis'].get('categories', {})
    for category, stats in list(categories.items())[:5]:
        print(f"  {category}: ${stats['sum']:,.2f} ({stats['count']} payments)")
    
    print(f"\nFiles saved to: {collector.data_dir}")
    
    return results

if __name__ == "__main__":
    main()