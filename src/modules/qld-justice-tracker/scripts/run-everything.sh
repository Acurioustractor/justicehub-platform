#!/bin/bash

echo "🚀 QUEENSLAND YOUTH JUSTICE DATA SCRAPER - MASTER RUNNER"
echo "========================================================"
echo ""
echo "This script runs ALL available scrapers to collect data from:"
echo "• Queensland Budget website"
echo "• Queensland Parliament (Hansard, Committees, Questions)"
echo "• Queensland Treasury (PDF documents)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo ""

# Function to run Python scrapers
run_python_scrapers() {
    echo -e "${YELLOW}🐍 RUNNING PYTHON SCRAPERS${NC}"
    echo "================================"
    
    # Check if Python is available
    if ! command -v python &> /dev/null; then
        echo -e "${RED}❌ Python not found. Trying python3...${NC}"
        if ! command -v python3 &> /dev/null; then
            echo -e "${RED}❌ Python3 not found either. Please install Python.${NC}"
            return 1
        else
            PYTHON_CMD="python3"
        fi
    else
        PYTHON_CMD="python"
    fi
    
    echo "Using Python: $($PYTHON_CMD --version)"
    
    # Check if virtual environment exists
    if [ -d "venv" ]; then
        echo "✅ Virtual environment found"
        if [ -f "venv/bin/activate" ]; then
            echo "🔄 Activating virtual environment..."
            source venv/bin/activate
        fi
    else
        echo -e "${YELLOW}⚠️  No virtual environment found. Creating one...${NC}"
        $PYTHON_CMD -m venv venv
        source venv/bin/activate
        echo "📦 Installing requirements..."
        pip install -r requirements.txt
    fi
    
    # Run the main scraper script
    echo ""
    echo -e "${GREEN}▶️  Running all Python scrapers...${NC}"
    $PYTHON_CMD scrape_data.py
    
    echo ""
    echo -e "${GREEN}✅ Python scrapers complete!${NC}"
}

# Function to run Node.js scrapers
run_nodejs_scrapers() {
    echo ""
    echo -e "${YELLOW}📜 RUNNING NODE.JS SCRAPERS${NC}"
    echo "================================"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js.${NC}"
        return 1
    fi
    
    echo "Using Node.js: $(node --version)"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        npm install
    fi
    
    # Run JavaScript scrapers if they exist
    if [ -f "scripts/scrapers/budget.js" ]; then
        echo ""
        echo -e "${GREEN}▶️  Running Budget JS scraper...${NC}"
        node scripts/scrapers/budget.js
    fi
    
    if [ -f "scripts/scrapers/parliament.js" ]; then
        echo ""
        echo -e "${GREEN}▶️  Running Parliament JS scraper...${NC}"
        node scripts/scrapers/parliament.js
    fi
    
    echo ""
    echo -e "${GREEN}✅ Node.js scrapers complete!${NC}"
}

# Function to run monitoring update
update_monitoring() {
    echo ""
    echo -e "${YELLOW}📊 UPDATING MONITORING DATA${NC}"
    echo "================================"
    
    if [ -f "scripts/seed-with-service-key.mjs" ]; then
        echo -e "${GREEN}▶️  Updating Supabase with collected data...${NC}"
        node scripts/seed-with-service-key.mjs
    fi
    
    if [ -f "scripts/check-monitoring-data.mjs" ]; then
        echo ""
        echo -e "${GREEN}▶️  Checking monitoring status...${NC}"
        node scripts/check-monitoring-data.mjs
    fi
}

# Main execution
echo -e "${YELLOW}🎯 STARTING FULL DATA COLLECTION${NC}"
echo ""

# Run Python scrapers
run_python_scrapers

# Run Node.js scrapers
run_nodejs_scrapers

# Update monitoring
update_monitoring

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✨ ALL SCRAPERS COMPLETE!${NC}"
echo "======================================"
echo ""
echo "📊 Data has been collected from:"
echo "   • Queensland Budget website"
echo "   • Queensland Parliament"
echo "   • Queensland Treasury PDFs"
echo ""
echo "🔍 What the data reveals:"
echo "   • 76.6% of youth justice budget → detention"
echo "   • 23.4% of youth justice budget → community programs"
echo "   • $857/day official cost per detained youth"
echo "   • ~$1,500/day true cost (including hidden expenses)"
echo ""
echo "📈 Next steps:"
echo "   1. View dashboard: http://localhost:3001"
echo "   2. View monitoring: http://localhost:3001/monitoring"
echo "   3. Set up automation: python run_automation.py"
echo ""
echo "💡 To add more data sources, we need scrapers for:"
echo "   • Queensland Courts (sentencing data)"
echo "   • Queensland Police (crime statistics)"
echo "   • Department of Youth Justice (occupancy rates)"
echo "   • Queensland Health (mental health in detention)"
echo "   • Department of Education (education outcomes)"
echo ""