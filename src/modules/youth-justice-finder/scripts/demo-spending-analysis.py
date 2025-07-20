#!/usr/bin/env python3
"""
Demo Youth Justice Spending Analysis
Uses your original CSV URL to demonstrate the analysis system
"""

import requests
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path
import datetime
import json

# Use your working CSV URL
CSV_URL = "https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-ontimepayments-2024-25.csv"

def download_and_analyze():
    """Download current data and perform demo analysis"""
    
    print("=" * 60)
    print("YOUTH JUSTICE SPENDING ANALYSIS DEMO")
    print("=" * 60)
    print(f"Downloading data from: {CSV_URL}")
    
    try:
        # Download the data
        response = requests.get(CSV_URL, verify=False)  # Skip SSL verification for demo
        response.raise_for_status()
        
        # Save locally
        data_file = "demo_spending_data.csv"
        with open(data_file, 'wb') as f:
            f.write(response.content)
        
        print(f"✓ Data downloaded successfully: {len(response.content)} bytes")
        
        # Load into pandas
        df = pd.read_csv(data_file)
        print(f"✓ Loaded {len(df)} records with {len(df.columns)} columns")
        
        # Display basic info
        print(f"\nColumns available: {list(df.columns)}")
        print(f"Date range: {df.index.min()} to {df.index.max()}")
        
        # Try to find amount columns
        amount_cols = [col for col in df.columns if any(word in col.lower() for word in ['amount', 'value', 'cost', 'price', 'total'])]
        print(f"Potential amount columns: {amount_cols}")
        
        # Try to find supplier/vendor columns  
        supplier_cols = [col for col in df.columns if any(word in col.lower() for word in ['supplier', 'vendor', 'company', 'contractor', 'provider'])]
        print(f"Potential supplier columns: {supplier_cols}")
        
        # Try to find description columns
        desc_cols = [col for col in df.columns if any(word in col.lower() for word in ['description', 'service', 'details', 'purpose'])]
        print(f"Potential description columns: {desc_cols}")
        
        # Show sample data
        print(f"\nFirst 5 rows:")
        print(df.head())
        
        # Basic analysis if we can identify key columns
        if amount_cols:
            amount_col = amount_cols[0]
            
            # Try to convert to numeric
            if df[amount_col].dtype == 'object':
                df[amount_col] = pd.to_numeric(df[amount_col].astype(str).str.replace('[$,]', '', regex=True), errors='coerce')
            
            # Summary statistics
            total_amount = df[amount_col].sum()
            avg_amount = df[amount_col].mean()
            max_amount = df[amount_col].max()
            
            print(f"\n" + "=" * 40)
            print("FINANCIAL SUMMARY")
            print("=" * 40)
            print(f"Total Amount: ${total_amount:,.2f}")
            print(f"Average Payment: ${avg_amount:,.2f}")
            print(f"Largest Payment: ${max_amount:,.2f}")
            print(f"Number of Payments: {len(df):,}")
            
            # Top payments
            print(f"\nTOP 10 LARGEST PAYMENTS:")
            top_payments = df.nlargest(10, amount_col)
            for i, (_, row) in enumerate(top_payments.iterrows(), 1):
                supplier = row[supplier_cols[0]] if supplier_cols else "Unknown"
                amount = row[amount_col]
                print(f"{i:2d}. ${amount:,.2f} - {supplier}")
        
        # Supplier analysis
        if supplier_cols:
            supplier_col = supplier_cols[0]
            supplier_counts = df[supplier_col].value_counts()
            
            print(f"\n" + "=" * 40)
            print("SUPPLIER ANALYSIS")
            print("=" * 40)
            print(f"Total Unique Suppliers: {len(supplier_counts)}")
            print(f"\nTOP 10 SUPPLIERS BY PAYMENT COUNT:")
            for i, (supplier, count) in enumerate(supplier_counts.head(10).items(), 1):
                print(f"{i:2d}. {supplier}: {count} payments")
            
            if amount_cols:
                supplier_spending = df.groupby(supplier_col)[amount_cols[0]].sum().sort_values(ascending=False)
                print(f"\nTOP 10 SUPPLIERS BY TOTAL SPENDING:")
                for i, (supplier, total) in enumerate(supplier_spending.head(10).items(), 1):
                    print(f"{i:2d}. {supplier}: ${total:,.2f}")
        
        # Create visualizations if possible
        if amount_cols and len(df) > 0:
            create_demo_visualizations(df, amount_cols[0], supplier_cols[0] if supplier_cols else None)
        
        # Service categorization demo
        if desc_cols or supplier_cols:
            analyze_service_categories(df, desc_cols[0] if desc_cols else supplier_cols[0])
        
        print(f"\n" + "=" * 60)
        print("DEMO ANALYSIS COMPLETE")
        print("=" * 60)
        print("This demonstrates the type of analysis possible with historical data.")
        print("The full system would:")
        print("• Collect data from multiple years")
        print("• Track spending trends over time") 
        print("• Identify seasonal patterns")
        print("• Detect anomalies and outliers")
        print("• Generate comprehensive reports")
        print("• Create interactive dashboards")
        
        return df
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nThis could be due to:")
        print("• Network connectivity issues")
        print("• SSL certificate problems")
        print("• Data format changes")
        print("• URL changes")
        return None

def create_demo_visualizations(df, amount_col, supplier_col=None):
    """Create sample visualizations"""
    try:
        plt.style.use('default')
        fig_dir = Path("demo_figures")
        fig_dir.mkdir(exist_ok=True)
        
        # Payment amount distribution
        plt.figure(figsize=(12, 8))
        
        plt.subplot(2, 2, 1)
        df[amount_col].hist(bins=50, alpha=0.7)
        plt.title('Payment Amount Distribution')
        plt.xlabel('Payment Amount ($)')
        plt.ylabel('Frequency')
        plt.yscale('log')
        
        # Payment amounts over time (if we can extract dates)
        plt.subplot(2, 2, 2)
        plt.scatter(range(len(df)), df[amount_col], alpha=0.5)
        plt.title('Payment Amounts Over Time')
        plt.xlabel('Payment Number')
        plt.ylabel('Amount ($)')
        
        # Top suppliers (if available)
        if supplier_col:
            plt.subplot(2, 2, 3)
            top_suppliers = df.groupby(supplier_col)[amount_col].sum().nlargest(10)
            top_suppliers.plot(kind='barh')
            plt.title('Top 10 Suppliers by Total Spending')
            plt.xlabel('Total Spending ($)')
            
            # Supplier payment frequency
            plt.subplot(2, 2, 4)
            supplier_counts = df[supplier_col].value_counts().head(10)
            supplier_counts.plot(kind='bar')
            plt.title('Top 10 Suppliers by Payment Count')
            plt.xlabel('Supplier')
            plt.ylabel('Number of Payments')
            plt.xticks(rotation=45)
        
        plt.tight_layout()
        plt.savefig(fig_dir / 'demo_analysis.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Visualizations saved to {fig_dir}/demo_analysis.png")
        
    except Exception as e:
        print(f"⚠️  Visualization error: {e}")

def analyze_service_categories(df, text_col):
    """Demo service categorization"""
    
    service_categories = {
        "detention_services": ["detention", "custody", "secure", "centre"],
        "community_services": ["community", "supervision", "probation"],
        "support_services": ["counselling", "mental health", "support"],
        "legal_services": ["legal", "court", "advocacy"],
        "education_services": ["education", "training", "school"],
        "health_services": ["health", "medical", "therapy"],
        "administration": ["admin", "management", "overhead"]
    }
    
    # Categorize based on text content
    def categorize_text(text):
        text_lower = str(text).lower()
        for category, keywords in service_categories.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        return "other"
    
    df['service_category'] = df[text_col].apply(categorize_text)
    
    category_counts = df['service_category'].value_counts()
    
    print(f"\n" + "=" * 40)
    print("SERVICE CATEGORIZATION")
    print("=" * 40)
    for category, count in category_counts.items():
        percentage = (count / len(df)) * 100
        print(f"{category}: {count} payments ({percentage:.1f}%)")

def main():
    """Run demo analysis"""
    df = download_and_analyze()
    
    if df is not None:
        print(f"\n✅ Demo completed successfully!")
        print(f"📁 Demo files created in current directory")
        return df
    else:
        print(f"\n❌ Demo failed - see errors above")
        return None

if __name__ == "__main__":
    main()