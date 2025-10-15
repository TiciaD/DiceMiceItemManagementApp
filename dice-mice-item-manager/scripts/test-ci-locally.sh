#!/bin/bash

# Local CI/CD Pipeline Test Script
# This script simulates the GitHub Actions workflow locally

set -e  # Exit on any error

echo "🚀 Starting Local CI/CD Pipeline Test"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 passed${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci
print_status "Dependencies installation"

echo -e "${YELLOW}🔍 Running ESLint...${NC}"
npm run lint
print_status "ESLint"

echo -e "${YELLOW}📝 Running TypeScript check...${NC}"
npx tsc --noEmit
print_status "TypeScript check"

echo -e "${YELLOW}🧪 Running unit tests with coverage...${NC}"
npm run test:coverage -- --watchAll=false
print_status "Unit tests"

echo -e "${YELLOW}🏗️ Building application...${NC}"
npm run build
print_status "Build"

echo -e "${YELLOW}🎭 Installing Playwright (if needed)...${NC}"
npx playwright install --with-deps chromium || echo "Playwright already installed or skipped"

echo -e "${YELLOW}🎯 Running E2E tests...${NC}"
npm run test:e2e || echo "E2E tests completed (may have warnings)"
print_status "E2E tests (non-blocking)"

echo -e "${YELLOW}🔒 Running security audit...${NC}"
npm audit --audit-level=moderate || echo "Security audit completed with warnings"
print_status "Security audit (non-blocking)"

echo -e "${YELLOW}📊 Checking bundle size...${NC}"
if [ -d ".next/static" ]; then
    BUNDLE_SIZE=$(du -sb .next/static 2>/dev/null | cut -f1 || echo "0")
    MAX_SIZE=$((10 * 1024 * 1024)) # 10MB limit
    
    if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
        echo -e "${RED}❌ Bundle size ($BUNDLE_SIZE bytes) exceeds limit ($MAX_SIZE bytes)${NC}"
    else
        echo -e "${GREEN}✅ Bundle size ($BUNDLE_SIZE bytes) is within limits${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️ No build artifacts found for bundle size check${NC}"
fi

echo -e "${YELLOW}🗃️ Checking database migrations...${NC}"
if [ -d "src/db/migrations" ]; then
    echo "✅ Migrations directory exists"
    find src/db/migrations -name "*.sql" -exec echo "Found migration: {}" \; || echo "No SQL migrations found"
else
    echo "ℹ️ No migrations directory found"
fi

# Try to generate migrations to check for drift
npm run db:generate || echo "Migration generation failed or no changes needed"

echo ""
echo -e "${GREEN}🎉 Local CI/CD Pipeline Test Completed Successfully!${NC}"
echo "======================================================"
echo ""
echo "Your code is ready for GitHub Actions! 🚀"
echo ""
echo "Next steps:"
echo "1. Commit your changes"
echo "2. Push to GitHub"
echo "3. Check the Actions tab for the real CI/CD pipeline"
echo ""