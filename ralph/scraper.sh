#!/bin/bash
# Ralph Scraper - Always-On Data Ingestion Agent
# Continuously processes the ALMA discovered links queue
# Based on the Ralph Wiggum methodology: Read → Pick → Scrape → Store → Repeat

set -e

# Configuration
MAX_ITERATIONS=${MAX_ITERATIONS:-50}
BATCH_SIZE=${BATCH_SIZE:-5}
PROJECT_DIR=${PROJECT_DIR:-$(pwd)}
PROGRESS_FILE=${PROGRESS_FILE:-"ralph/scraper-progress.txt"}
AGENT_CMD=${AGENT_CMD:-"claude --dangerously-skip-permissions"}
SCRAPE_MODE=${SCRAPE_MODE:-"queue"}  # queue, stale, all

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Ralph Scraper - Always-On Ingestion${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "Project: ${GREEN}$PROJECT_DIR${NC}"
echo -e "Mode: ${GREEN}$SCRAPE_MODE${NC}"
echo -e "Batch Size: ${GREEN}$BATCH_SIZE${NC}"
echo -e "Max Iterations: ${GREEN}$MAX_ITERATIONS${NC}"
echo ""

# Ensure we're in the project directory
cd "$PROJECT_DIR"

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
    echo "# Ralph Scraper Progress Log" > "$PROGRESS_FILE"
    echo "# Started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

# Build the scraper prompt
build_scraper_prompt() {
    local mode=$1
    local batch=$2
    local progress_content=""
    if [ -f "$PROGRESS_FILE" ]; then
        progress_content=$(tail -50 "$PROGRESS_FILE")
    fi

    cat << EOF
You are working as the Ralph Scraper - an always-on data ingestion agent for JusticeHub.

## Your Task
Process the next batch of discovered links from the ALMA queue.

### Mode: $mode
### Batch Size: $batch

## Workflow

1. **Query the Queue**
   - Call the Supabase API to get $batch pending links from \`alma_discovered_links\`
   - Priority order: predicted_relevance DESC, created_at ASC
   - Filter: status = 'pending' OR status = 'approved'

2. **For Each Link**
   a. Update status to 'processing'
   b. Fetch the URL content using Firecrawl MCP or fetch
   c. Extract relevant data based on predicted_type:
      - government: Policy documents, statistics, announcements
      - research: Studies, reports, methodologies
      - media: News articles, press releases
      - legal: Court decisions, legislation updates
      - indigenous: First Nations programs, cultural content
   d. Store extracted data in appropriate table:
      - alma_interventions: Evidence-based programs
      - alma_evidence: Research and statistics
      - scraped_services: Service listings
   e. Update link status to 'scraped' with metadata
   f. Log the result

3. **Handle Errors**
   - If scrape fails, update status to 'failed' with error message
   - If URL is blocked/404, mark as 'rejected'
   - Continue to next link

4. **Stop Conditions**
   - If queue is empty: <promise>QUEUE_EMPTY</promise>
   - If batch complete: <promise>ITERATION_DONE</promise>
   - If blocked/rate limited: <promise>BLOCKED:rate_limit</promise>

## API Endpoints Available
- GET /api/admin/data-operations/queue - Get pending links
- POST /api/admin/data-operations/scrape - Process a link
- PATCH /api/admin/data-operations/queue/[id] - Update link status

## Database Tables
- alma_discovered_links: The queue (id, url, status, predicted_type, predicted_relevance)
- alma_interventions: Store intervention data
- alma_evidence: Store evidence/research
- scraped_services: Store service listings

## Recent Progress
\`\`\`
$progress_content
\`\`\`

## Important Rules
- Process ONE link at a time, verify success before moving on
- Respect rate limits (wait 2s between requests)
- Log all activity to the progress file
- Extract structured data, not raw HTML
- Cultural sensitivity: Flag First Nations content for review
- Don't generate fake data - only extract what exists

Begin processing the queue now.
EOF
}

# Check queue depth
check_queue() {
    # This would normally call the API, but for now we use a placeholder
    # In production, this calls: curl -s "$API_URL/api/admin/data-operations/stats" | jq '.queue.pending'
    echo "Checking queue depth..."
}

# Main loop
for i in $(seq 1 $MAX_ITERATIONS); do
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Scraper Iteration $i of $MAX_ITERATIONS${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""

    # Record iteration start
    echo "## Iteration $i - $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$PROGRESS_FILE"

    # Build prompt and run agent
    PROMPT=$(build_scraper_prompt "$SCRAPE_MODE" "$BATCH_SIZE")

    # Create a temporary file for the prompt
    PROMPT_FILE=$(mktemp)
    echo "$PROMPT" > "$PROMPT_FILE"

    # Run the agent and capture output
    OUTPUT_FILE=$(mktemp)
    echo -e "${BLUE}Starting scraper agent...${NC}"
    echo ""

    # Run claude with the prompt
    if echo "$PROMPT" | $AGENT_CMD 2>&1 | tee "$OUTPUT_FILE"; then
        echo ""
    else
        echo -e "${RED}Agent exited with error${NC}"
        echo "ERROR: Agent failed at $(date)" >> "$PROGRESS_FILE"
    fi

    # Check for completion signals
    if grep -q "<promise>QUEUE_EMPTY</promise>" "$OUTPUT_FILE"; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  QUEUE EMPTY - All links processed!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo "QUEUE_EMPTY at $(date)" >> "$PROGRESS_FILE"
        rm "$PROMPT_FILE" "$OUTPUT_FILE"
        break
    fi

    if grep -q "<promise>BLOCKED:" "$OUTPUT_FILE"; then
        REASON=$(grep -oP '(?<=<promise>BLOCKED:)[^<]+' "$OUTPUT_FILE" | head -1)
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}  BLOCKED: $REASON${NC}"
        echo -e "${RED}========================================${NC}"
        echo "BLOCKED: $REASON at $(date)" >> "$PROGRESS_FILE"
        rm "$PROMPT_FILE" "$OUTPUT_FILE"

        # If rate limited, wait and continue
        if [[ "$REASON" == "rate_limit" ]]; then
            echo -e "${YELLOW}Waiting 60 seconds for rate limit...${NC}"
            sleep 60
            continue
        fi
        break
    fi

    if grep -q "<promise>ITERATION_DONE</promise>" "$OUTPUT_FILE"; then
        echo ""
        echo -e "${GREEN}Iteration $i completed successfully${NC}"
        echo "ITERATION_DONE at $(date)" >> "$PROGRESS_FILE"
    fi

    # Cleanup temp files
    rm "$PROMPT_FILE" "$OUTPUT_FILE"

    # Delay between iterations (respect rate limits)
    echo ""
    echo -e "${BLUE}Waiting 10 seconds before next iteration...${NC}"
    sleep 10
done

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Ralph Scraper Session Complete${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "Progress log: $PROGRESS_FILE"
echo "Queue status: Check /admin/data-operations"
