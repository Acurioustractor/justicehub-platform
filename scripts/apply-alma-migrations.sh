#!/bin/bash
# Apply ALMA migrations directly to Supabase
# This bypasses Supabase CLI migration history and just runs the SQL

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== ALMA Migration Deployment ===${NC}"

# Get database credentials from .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}ERROR: .env.local not found${NC}"
    exit 1
fi

# Extract values
SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d '=' -f2)
DB_PASSWORD=$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d '=' -f2)

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}ERROR: SUPABASE_DB_PASSWORD not found in .env.local${NC}"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

# Build connection string
DB_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo -e "${GREEN}Connected to: ${PROJECT_REF}${NC}"

# Check if ALMA tables already exist
echo -e "\n${YELLOW}Checking if ALMA tables exist...${NC}"
export PGPASSWORD="$DB_PASSWORD"

EXISTING_TABLES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'alma_%';" 2>/dev/null || echo "0")

if [ "$EXISTING_TABLES" -gt 0 ]; then
    echo -e "${YELLOW}Found $EXISTING_TABLES ALMA tables already exist.${NC}"
    read -p "Do you want to DROP and recreate them? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Dropping existing ALMA tables...${NC}"
        psql "$DB_URL" -c "DROP TABLE IF EXISTS alma_usage_log, alma_consent_ledger, alma_evidence_outcomes, alma_intervention_contexts, alma_intervention_evidence, alma_intervention_outcomes, alma_outcomes, alma_evidence, alma_community_contexts, alma_interventions CASCADE;" 2>&1
        echo -e "${GREEN}Dropped existing tables${NC}"
    else
        echo -e "${YELLOW}Skipping ALMA migrations (tables already exist)${NC}"
        exit 0
    fi
fi

# Apply migrations in order
MIGRATIONS=(
    "supabase/migrations/20250131000001_alma_core_entities.sql"
    "supabase/migrations/20250131000002_alma_rls_policies.sql"
    "supabase/migrations/20250131000003_alma_hybrid_linking.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "$migration" ]; then
        echo -e "${RED}ERROR: Migration file not found: $migration${NC}"
        exit 1
    fi

    echo -e "\n${YELLOW}Applying: $(basename $migration)${NC}"

    # Apply the migration
    if psql "$DB_URL" -f "$migration" 2>&1 | tee /tmp/migration_output.log; then
        # Check for errors in output
        if grep -qi "error" /tmp/migration_output.log; then
            echo -e "${RED}Migration had errors, but may have partially succeeded${NC}"
            echo -e "${YELLOW}Check the output above${NC}"
        else
            echo -e "${GREEN}✓ Success: $(basename $migration)${NC}"
        fi
    else
        echo -e "${RED}✗ Failed: $(basename $migration)${NC}"
        exit 1
    fi
done

# Verify ALMA tables were created
echo -e "\n${YELLOW}Verifying ALMA tables...${NC}"
TABLES=$(psql "$DB_URL" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'alma_%' ORDER BY tablename;" 2>&1)

if [ -z "$TABLES" ]; then
    echo -e "${RED}ERROR: No ALMA tables found after migration!${NC}"
    exit 1
fi

echo -e "${GREEN}ALMA tables created:${NC}"
echo "$TABLES"

# Count tables
TABLE_COUNT=$(echo "$TABLES" | grep -v '^$' | wc -l | tr -d ' ')
echo -e "\n${GREEN}✓ Total ALMA tables: $TABLE_COUNT${NC}"

if [ "$TABLE_COUNT" -lt 10 ]; then
    echo -e "${YELLOW}WARNING: Expected 10 tables, found $TABLE_COUNT${NC}"
else
    echo -e "${GREEN}✓ All ALMA tables created successfully!${NC}"
fi

# Test a simple query
echo -e "\n${YELLOW}Testing database connection...${NC}"
TEST_QUERY=$(psql "$DB_URL" -t -c "SELECT 'ALMA is ready!' as status;" 2>&1)
echo -e "${GREEN}$TEST_QUERY${NC}"

echo -e "\n${GREEN}=== ALMA Migration Complete ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Verify in Supabase Studio: https://supabase.com/dashboard/project/${PROJECT_REF}/editor"
echo -e "  2. Test with: SELECT * FROM alma_interventions;"
echo -e "  3. Optionally backfill: SELECT * FROM backfill_all_community_programs_to_alma();"
