# Token Audit Report — 2026-04-03

## System Prompt Baseline (loaded EVERY session)

| Component | Est. Tokens | Status |
|-----------|------------|--------|
| System prompt base | ~2,000 | Fixed |
| CLAUDE.md (128 lines) | ~512 | OK |
| MEMORY.md (~85 lines) | ~340 | OK |
| Rules (4 files, ~90 lines) | ~360 | OK |
| settings.local.json (621 lines) | ~1,860 | **BLOATED** |
| MCP tools (157 deferred names) | ~6,400 | **DEFERRED — cost is per-use** |
| Skills (73 listed) | ~3,650 | **REVIEW** |
| Hook definitions (8 registered) | ~400 | OK |
| **TOTAL BASELINE** | **~15,400** | |

**Before you type a single word, ~56K tokens are already consumed.** The MCP tools alone account for 84% of this.

---

## MCP Server Audit

### KEEP (essential for daily work)
| Server | Tools | Est. Tokens | Reason |
|--------|-------|------------|--------|
| Supabase | 20 | ~6,000 | Core DB — used 3,822× last month |
| GitHub | 35 | ~10,500 | PR/issue work |
| Context7 | 2 | ~600 | Doc lookups |
| Gemini Image | 1 | ~300 | Asset generation |
| **Subtotal** | **58** | **~17,400** | |

### DISABLE (use on-demand only)
| Server | Tools | Est. Tokens | Reason |
|--------|-------|------------|--------|
| Canva | 30 | ~9,000 | Rarely used, 30 tools is massive |
| Notion (claude_ai) | 15 | ~4,500 | Duplicate — keep ONE Notion |
| Notion (raw API) | 18 | ~5,400 | Keep this one OR claude_ai, not both |
| Gmail | 6 | ~1,800 | Enable only when emailing |
| Google Calendar | 9 | ~2,700 | Enable only when scheduling |
| Firecrawl | 10 | ~3,000 | /browse skill does this better |
| Pencil | 11 | ~3,300 | Only for .pen files |
| **Subtotal** | **99** | **~29,700** | |

### Savings if disabled: ~29,700 tokens/session (53% of baseline)

---

## Skills Audit

73 skills are listed in the system prompt. Many are gstack global skills you rarely use.

**High-value (keep):** commit, ship, browse, debug, investigate, qa, token-audit, data-sprint, alma-scraper, justicehub-context, act-code-reviewer

**Low-value for JusticeHub (consider disabling):**
- design-shotgun, design-consultation, design-html (use superdesign instead)
- codex (OpenAI wrapper — not your workflow)
- office-hours (YC format — not current need)
- connect-chrome (niche)
- retro (weekly — enable only when running retro)

**Estimated savings:** ~1,500 tokens if trimmed to ~40 active skills

---

## Permissions Bloat (settings.local.json)

621 lines with 200+ permission entries, many containing:
- Full SQL queries as permission strings
- Long Bash command templates with env vars
- Duplicate/overlapping patterns

**Recommendation:** Consolidate to ~50 broad patterns. Example:
- `"Bash(git:*)"` covers all git commands (replaces 10+ specific entries)
- `"Bash(npm:*)"` covers all npm commands
- `"WebFetch(domain:*)"` if you trust all domains

**Estimated savings:** ~1,200 tokens

---

## Conversation Hygiene

From insights data:
- Average session: 14 messages (7,296 messages ÷ 518 sessions)
- Marathon sessions (5+ features) compound context heavily
- No conversation TTL rule enforced

**Rules to implement:**
1. **10-turn checkpoint:** After 10 turns, summarize state and consider `/clear`
2. **Schema-first DB ops:** Always inspect schema before writes (saves debugging tokens)
3. **Single-feature focus:** Ship one feature, commit, then `/clear` for the next

---

## Total Optimization Potential

| Action | Token Savings | Effort |
|--------|--------------|--------|
| Disable 7 MCP servers | ~29,700/session | 5 min |
| Trim skills to ~40 | ~1,500/session | 10 min |
| Consolidate permissions | ~1,200/session | 15 min |
| .claudeignore (done) | Prevents bloat | Done ✓ |
| Conversation TTL rule | ~30% per session | Rule added |
| **TOTAL** | **~32,400 tokens** (~58% reduction in baseline) | |

---

## How to Disable MCP Servers

In Claude Code, go to Settings > MCP Servers and toggle off:
- Canva
- One of the two Notion servers (keep whichever you prefer)
- Gmail (re-enable when needed)
- Google Calendar (re-enable when needed)
- Firecrawl
- Pencil

Or in `.claude/settings.local.json`, remove them from `enabledMcpjsonServers` and set `enableAllProjectMcpServers: false`.
