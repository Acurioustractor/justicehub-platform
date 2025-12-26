#!/bin/bash

# ACT Project Health Check
# Validates project setup and configuration

set -e

echo "🏥 ACT Project Health Check"
echo "==========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Helper function for checks
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNED++))
}

# ===================================================================
# Environment Checks
# ===================================================================
echo -e "${BLUE}Environment:${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed: v$NPM_VERSION"
else
    check_fail "npm not installed"
fi

# Check git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    check_pass "git installed: v$GIT_VERSION"
else
    check_fail "git not installed"
fi

echo ""

# ===================================================================
# Project Files
# ===================================================================
echo -e "${BLUE}Project Files:${NC}"

# Check essential files
[ -f "package.json" ] && check_pass "package.json exists" || check_warn "package.json missing"
[ -f "README.md" ] && check_pass "README.md exists" || check_fail "README.md missing"
[ -f "CLAUDE.md" ] && check_pass "CLAUDE.md exists" || check_warn "CLAUDE.md missing"
[ -f ".gitignore" ] && check_pass ".gitignore exists" || check_warn ".gitignore missing"
[ -f ".env.example" ] && check_pass ".env.example exists" || check_warn ".env.example missing"
[ -f "CONTRIBUTING.md" ] && check_pass "CONTRIBUTING.md exists" || check_warn "CONTRIBUTING.md missing"

echo ""

# ===================================================================
# Dependencies
# ===================================================================
echo -e "${BLUE}Dependencies:${NC}"

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        check_pass "node_modules exists"

        # Check for package-lock.json
        if [ -f "package-lock.json" ]; then
            check_pass "package-lock.json exists"
        else
            check_warn "package-lock.json missing (run 'npm install')"
        fi
    else
        check_fail "node_modules missing (run 'npm install')"
    fi
else
    check_warn "No package.json - skipping dependency checks"
fi

echo ""

# ===================================================================
# Environment Variables
# ===================================================================
echo -e "${BLUE}Environment Variables:${NC}"

if [ -f ".env.example" ]; then
    check_pass ".env.example exists"

    if [ -f ".env.local" ]; then
        check_pass ".env.local exists"

        # Check if .env.local is different from .env.example
        if cmp -s .env.example .env.local; then
            check_warn ".env.local is identical to .env.example (needs configuration)"
        else
            check_pass ".env.local has been customized"
        fi
    else
        check_warn ".env.local missing (run './scripts/setup.sh')"
    fi
else
    check_warn "No .env.example found"
fi

# Check if .env is tracked (should not be)
if [ -f ".env" ]; then
    check_warn ".env file exists (should use .env.local instead)"
fi

echo ""

# ===================================================================
# Git Configuration
# ===================================================================
echo -e "${BLUE}Git Configuration:${NC}"

if [ -d ".git" ]; then
    check_pass "Git repository initialized"

    # Check for remote
    if git remote -v &> /dev/null; then
        REMOTE=$(git remote -v | head -n1 | awk '{print $2}')
        check_pass "Git remote configured: $REMOTE"
    else
        check_warn "No git remote configured"
    fi

    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "Working directory clean"
    else
        check_warn "Uncommitted changes present"
    fi
else
    check_fail "Not a git repository"
fi

echo ""

# ===================================================================
# Documentation
# ===================================================================
echo -e "${BLUE}Documentation:${NC}"

[ -d "docs" ] && check_pass "docs/ directory exists" || check_warn "docs/ directory missing"
[ -f "docs/README.md" ] && check_pass "docs/README.md exists" || check_warn "docs/README.md missing"
[ -d "docs/quick-starts" ] && check_pass "docs/quick-starts/ exists" || check_warn "docs/quick-starts/ missing"

echo ""

# ===================================================================
# Claude Skills
# ===================================================================
echo -e "${BLUE}Claude Skills:${NC}"

[ -d ".claude" ] && check_pass ".claude/ directory exists" || check_warn ".claude/ directory missing"
[ -f ".claude/SKILLS_GUIDE.md" ] && check_pass "SKILLS_GUIDE.md exists" || check_warn "SKILLS_GUIDE.md missing"

# Check for skills directories
if [ -d ".claude/skills" ]; then
    check_pass ".claude/skills/ exists"

    # Check for global skills link
    if [ -L ".claude/skills/global" ]; then
        check_pass "Global skills linked"
    else
        check_warn "Global skills not linked (run './scripts/setup.sh')"
    fi

    # Check for local skills
    if [ -d ".claude/skills/local" ]; then
        check_pass "Local skills directory exists"
    else
        check_warn "Local skills directory missing"
    fi
else
    check_warn ".claude/skills/ directory missing"
fi

echo ""

# ===================================================================
# Build & Scripts
# ===================================================================
if [ -f "package.json" ]; then
    echo -e "${BLUE}Available Scripts:${NC}"

    # Check for common scripts
    grep -q '"dev"' package.json && check_pass "dev script available" || check_warn "dev script missing"
    grep -q '"build"' package.json && check_pass "build script available" || check_warn "build script missing"
    grep -q '"test"' package.json && check_pass "test script available" || check_warn "test script missing"
    grep -q '"lint"' package.json && check_pass "lint script available" || check_warn "lint script missing"

    echo ""
fi

# ===================================================================
# Summary
# ===================================================================
echo ""
echo -e "${BLUE}==========================="
echo -e "Summary"
echo -e "===========================${NC}"
echo ""

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNED))

echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED / $TOTAL_CHECKS"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNED / $TOTAL_CHECKS"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED / $TOTAL_CHECKS"
echo ""

# Exit with appropriate code
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Fix the failed checks above, then run again."
    exit 1
elif [ $CHECKS_WARNED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Health check passed with warnings${NC}"
    echo "Consider addressing the warnings above."
    exit 0
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "Project is healthy and ready to go. 🌾"
    exit 0
fi
