# Local Development Port Allocation

## Standard Port Assignments

| Port | Project | Description |
|------|---------|-------------|
| 3000 | (Reserved) | Default Next.js - avoid using |
| 3001 | PICC Station | PICC Station Site Plan |
| 3002 | Palm Island | Palm Island Repository |
| 3003 | JusticeHub | Youth Justice Platform |
| 3030 | Empathy Ledger | Story Syndication Platform |
| 3004 | (Available) | Future project |
| 3005 | (Available) | Future project |
| 4000 | API Server | Backend services |
| 5432 | PostgreSQL | Local Supabase |
| 54321 | Supabase Studio | Local Supabase UI |

---

## Quick Start Commands

### JusticeHub (Port 3003)
```bash
cd /Users/benknight/Code/JusticeHub
PORT=3003 npm run dev
# OR
npm run dev  # Uses PORT from .env (3003)
```

### Empathy Ledger (Port 3030)
```bash
cd /Users/benknight/Code/empathy-ledger-v2
npm run dev -- -p 3030
```

### Check What's Running
```bash
# List all dev servers
lsof -i -P -n | grep LISTEN | grep -E 'node|next'

# Check specific port
lsof -ti:3003

# Find project for a port
lsof -p $(lsof -ti:3003) | grep cwd
```

---

## Running Multiple Projects

### Option 1: Separate Terminals
```bash
# Terminal 1: JusticeHub
cd ~/Code/JusticeHub && PORT=3003 npm run dev

# Terminal 2: Empathy Ledger
cd ~/Code/empathy-ledger-v2 && npm run dev -- -p 3030
```

### Option 2: Background Processes
```bash
# Start JusticeHub in background
cd ~/Code/JusticeHub && PORT=3003 npm run dev &

# Start Empathy Ledger in background
cd ~/Code/empathy-ledger-v2 && npm run dev -- -p 3030 &

# View running jobs
jobs -l
```

### Option 3: tmux/screen Session
```bash
# Create tmux session
tmux new-session -d -s dev

# JusticeHub pane
tmux send-keys -t dev "cd ~/Code/JusticeHub && npm run dev" Enter

# Split and add Empathy Ledger
tmux split-window -h -t dev
tmux send-keys -t dev "cd ~/Code/empathy-ledger-v2 && npm run dev -- -p 3030" Enter

# Attach to session
tmux attach -t dev
```

---

## Environment Configuration

### JusticeHub (.env)
```env
PORT=3003
NEXT_PUBLIC_APP_URL=http://localhost:3003
EMPATHY_LEDGER_API_URL=http://localhost:3030
```

### Empathy Ledger (.env.local)
```env
PORT=3030
NEXT_PUBLIC_APP_URL=http://localhost:3030
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -ti:3003

# Kill specific process
kill -9 $(lsof -ti:3003)

# Or kill by project directory
pkill -f "JusticeHub.*next"
```

### Check All Node Processes
```bash
ps aux | grep 'next dev' | grep -v grep
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

---

## Integration Testing

When testing JusticeHub ↔ Empathy Ledger integration:

1. Start Empathy Ledger first (port 3030)
2. Start JusticeHub second (port 3003)
3. Verify connectivity:
   ```bash
   # From JusticeHub, test Empathy Ledger API
   curl http://localhost:3030/api/health
   ```

### URLs for Testing
- JusticeHub: http://localhost:3003
- Empathy Ledger: http://localhost:3030
- JusticeHub Stories API: http://localhost:3003/api/stories
- Empathy Ledger External API: http://localhost:3030/api/external/stories
