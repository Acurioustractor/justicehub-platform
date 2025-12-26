#!/bin/bash

# ACT Project Setup Script
# One-command setup for ACT ecosystem projects

set -e  # Exit on error

echo "🌾 ACT Project Setup"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}Project directory:${NC} $PROJECT_ROOT"
echo ""

# Step 1: Check if package.json exists
if [ -f "package.json" ]; then
    echo -e "${BLUE}Step 1:${NC} Installing dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} No package.json found - skipping dependency installation"
    echo ""
fi

# Step 2: Setup environment variables
echo -e "${BLUE}Step 2:${NC} Setting up environment variables..."
if [ -f ".env.example" ]; then
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓${NC} Created .env.local from .env.example"
        echo -e "${YELLOW}⚠${NC} Please edit .env.local with your actual values"
    else
        echo -e "${YELLOW}⚠${NC} .env.local already exists - skipping"
    fi
else
    echo -e "${YELLOW}⚠${NC} No .env.example found - skipping env setup"
fi
echo ""

# Step 3: Link global Claude skills (if available)
echo -e "${BLUE}Step 3:${NC} Linking global Claude skills..."
GLOBAL_SKILLS_DIR="$HOME/act-global-skills"
LOCAL_SKILLS_LINK="$PROJECT_ROOT/.claude/skills/global"

if [ -d "$GLOBAL_SKILLS_DIR" ]; then
    # Create .claude/skills directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/.claude/skills"

    # Remove existing symlink if it exists
    if [ -L "$LOCAL_SKILLS_LINK" ]; then
        rm "$LOCAL_SKILLS_LINK"
    fi

    # Create new symlink
    ln -s "$GLOBAL_SKILLS_DIR" "$LOCAL_SKILLS_LINK"
    echo -e "${GREEN}✓${NC} Linked global skills from $GLOBAL_SKILLS_DIR"
else
    echo -e "${YELLOW}⚠${NC} Global skills not found at $GLOBAL_SKILLS_DIR"
    echo -e "   Run: git clone https://github.com/Acurioustractor/act-global-skills.git ~/act-global-skills"
fi
echo ""

# Step 4: Database setup (project-specific)
if [ -f "package.json" ]; then
    # Check for common database commands in package.json
    if grep -q '"db:migrate"' package.json; then
        echo -e "${BLUE}Step 4:${NC} Database setup available..."
        echo -e "${YELLOW}⚠${NC} Run 'npm run db:migrate' to setup database"
        echo ""
    elif grep -q '"db:push"' package.json; then
        echo -e "${BLUE}Step 4:${NC} Database setup available..."
        echo -e "${YELLOW}⚠${NC} Run 'npm run db:push' to setup database"
        echo ""
    fi
fi

# Step 5: Generate types (if applicable)
if [ -f "package.json" ]; then
    if grep -q '"db:types"' package.json; then
        echo -e "${BLUE}Step 5:${NC} Generating TypeScript types..."
        npm run db:types 2>/dev/null || echo -e "${YELLOW}⚠${NC} Type generation failed - run manually if needed"
        echo ""
    fi
fi

# Complete!
echo ""
echo -e "${GREEN}✓✓✓ Setup Complete! ✓✓✓${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local with your actual values"
echo "  2. Start development server: npm run dev"
echo "  3. Read docs/quick-starts/quick-start.md for detailed setup"
echo ""
echo "Available Claude skills:"
echo "  • /act-brand-alignment - ACT voice and content"
echo "  • Check .claude/SKILLS_GUIDE.md for more"
echo ""
echo "🌾 Happy coding! 🌾"
