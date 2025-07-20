#!/bin/bash

# Youth Justice Service Finder - Temporal Setup Script
# This script downloads and starts a local Temporal development server

set -e

echo "🏗️  Youth Justice Service Finder - Temporal Setup"
echo "=================================================="

# Check if Temporal CLI is installed
if ! command -v temporal &> /dev/null; then
    echo "📦 Installing Temporal CLI..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install temporal
        else
            echo "❌ Homebrew not found. Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sSf https://temporal.download/cli.sh | sh
        sudo mv temporal /usr/local/bin/
    else
        echo "❌ Unsupported OS. Please install Temporal CLI manually: https://docs.temporal.io/cli"
        exit 1
    fi
    
    echo "✅ Temporal CLI installed successfully"
else
    echo "✅ Temporal CLI already installed"
fi

# Check if Temporal server is already running
if curl -s http://localhost:7233 > /dev/null 2>&1; then
    echo "✅ Temporal server already running on port 7233"
else
    echo "🚀 Starting Temporal development server..."
    
    # Start Temporal server in background
    temporal server start-dev --ui-port 8080 --log-format pretty &
    TEMPORAL_PID=$!
    
    echo "⏳ Waiting for Temporal server to start..."
    
    # Wait for server to be ready (max 30 seconds)
    for i in {1..30}; do
        if curl -s http://localhost:7233 > /dev/null 2>&1; then
            echo "✅ Temporal server started successfully!"
            echo "📊 Web UI available at: http://localhost:8080"
            break
        fi
        
        if [ $i -eq 30 ]; then
            echo "❌ Temporal server failed to start within 30 seconds"
            exit 1
        fi
        
        sleep 1
    done
fi

echo ""
echo "🎉 Temporal is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Start the worker:    npm run temporal:worker"
echo "2. Setup schedules:     npm run temporal:setup"
echo "3. View dashboard:      http://localhost:8080"
echo ""
echo "🔧 Available commands:"
echo "• List schedules:       npm run temporal:list"
echo "• Trigger workflow:     npm run temporal:trigger <workflow>"
echo "• Stop server:          temporal server stop-dev"
echo ""