#!/usr/bin/env python3
"""
Youth Justice Spending Analysis Runner
Orchestrates the complete data collection and analysis process
"""

import sys
import os
from pathlib import Path
import subprocess
import logging

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.append(str(script_dir))

# Import with error handling
try:
    from historical_data_collector import HistoricalDataCollector
    from spending_analyzer import SpendingAnalyzer
except ImportError:
    # Try importing from current directory
    import importlib.util
    
    collector_spec = importlib.util.spec_from_file_location("historical_data_collector", script_dir / "historical-data-collector.py")
    collector_module = importlib.util.module_from_spec(collector_spec)
    collector_spec.loader.exec_module(collector_module)
    HistoricalDataCollector = collector_module.HistoricalDataCollector
    
    analyzer_spec = importlib.util.spec_from_file_location("spending_analyzer", script_dir / "spending-analyzer.py")
    analyzer_module = importlib.util.module_from_spec(analyzer_spec)
    analyzer_spec.loader.exec_module(analyzer_module)
    SpendingAnalyzer = analyzer_module.SpendingAnalyzer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def install_requirements():
    """Install required Python packages"""
    requirements = [
        'pandas',
        'requests', 
        'matplotlib',
        'seaborn',
        'numpy'
    ]
    
    for package in requirements:
        try:
            __import__(package)
            logger.info(f"✓ {package} already installed")
        except ImportError:
            logger.info(f"Installing {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

def main():
    """Run complete youth justice spending analysis"""
    print("\n" + "="*70)
    print("YOUTH JUSTICE SPENDING ANALYSIS SYSTEM")
    print("="*70)
    print("This will collect and analyze historical spending data from")
    print("Queensland Department of Youth Justice, Victoria and Sport")
    print("="*70)
    
    try:
        # Install requirements
        print("\n1. Installing required packages...")
        install_requirements()
        
        # Collect historical data
        print("\n2. Collecting historical data...")
        collector = HistoricalDataCollector()
        collection_results = collector.run_full_analysis()
        
        print(f"✓ Collected {collection_results['analysis']['summary'].get('total_records', 0):,} payment records")
        print(f"✓ Total spending analyzed: ${collection_results['analysis']['summary'].get('total_amount', 0):,.2f}")
        
        # Perform advanced analysis
        print("\n3. Performing advanced spending analysis...")
        analyzer = SpendingAnalyzer()
        analysis_results = analyzer.run_complete_analysis()
        
        # Display key findings
        print("\n" + "="*70)
        print("KEY FINDINGS")
        print("="*70)
        
        analysis = analysis_results['analysis']
        
        # Yearly trends
        if 'yearly_trends' in analysis:
            print("\nYEARLY SPENDING TRENDS:")
            for year, data in analysis['yearly_trends'].items():
                print(f"  {year}: ${data['sum']:,.2f} ({data['count']:,} payments)")
        
        # Top service categories
        if 'category_analysis' in analysis:
            print("\nTOP SERVICE CATEGORIES:")
            categories = sorted(analysis['category_analysis'].items(), 
                              key=lambda x: x[1]['sum'], reverse=True)
            for category, data in categories[:5]:
                print(f"  {category}: ${data['sum']:,.2f}")
        
        # Top suppliers
        if 'top_suppliers' in analysis:
            print("\nTOP SUPPLIERS:")
            for supplier, data in list(analysis['top_suppliers'].items())[:5]:
                supplier_short = supplier[:50] + "..." if len(supplier) > 50 else supplier
                print(f"  {supplier_short}: ${data['sum']:,.2f}")
        
        # Anomalies
        anomalies = analysis_results['anomalies']
        if anomalies:
            print("\nANOMALIES DETECTED:")
            if 'statistical_outliers' in anomalies:
                outlier_data = anomalies['statistical_outliers']
                print(f"  Statistical outliers: {outlier_data['count']} ({outlier_data['percentage']}%)")
            
            if 'large_payments' in anomalies:
                large_data = anomalies['large_payments']
                print(f"  Large payments (>99th percentile): {large_data['count']}")
                print(f"  Threshold: ${large_data['threshold']:,.2f}")
        
        # File locations
        data_dir = Path("historical_data")
        analysis_dir = data_dir / "analysis"
        
        print(f"\n" + "="*70)
        print("FILES CREATED")
        print("="*70)
        print(f"📁 Data directory: {data_dir.absolute()}")
        print(f"📁 Analysis directory: {analysis_dir.absolute()}")
        print(f"📊 Visualizations: {analysis_dir / 'figures'}")
        print(f"📄 Reports: Look for spending_report_*.txt files")
        print(f"📋 Raw data: processed_*.csv files")
        
        print("\n" + "="*70)
        print("NEXT STEPS")
        print("="*70)
        print("1. Review the generated report files")
        print("2. Examine visualizations in the figures folder")
        print("3. Use the CSV files for further analysis in Excel/other tools")
        print("4. Consider setting up automated monthly data collection")
        print("5. Share findings with relevant stakeholders")
        
        return analysis_results
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        print(f"\n❌ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Check internet connection for data downloads")
        print("2. Ensure you have write permissions to the current directory")
        print("3. Install missing Python packages manually if needed")
        return None

if __name__ == "__main__":
    results = main()
    if results:
        print("\n🎉 Analysis completed successfully!")
    else:
        print("\n❌ Analysis failed. See error messages above.")
        sys.exit(1)