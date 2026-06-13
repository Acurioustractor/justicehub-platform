# CONTAINED, Live Verification Results, 13 June 2026

> Read-only verification of the three pre-launch unknowns the master plan flagged for Ben. Done via Vercel env API, GHL Conversations API, Supabase, and code reads. Nothing was written, sent, or triggered. This file CORRECTS the master plan's "single biggest risk" framing: `EMAIL_ENABLED` is on.

## 1. EMAIL_ENABLED, CONFIRMED ON (was the flagged biggest risk)

- `EMAIL_ENABLED` is SET in Vercel production (encrypted, value not API-readable).
- **Proven on by real-world evidence:** the 11 June EOI test registration `knightts@gmail.com` (GHL contact `XOUZdpNxPTMpqkiArW2G`) has an outbound `TYPE_EMAIL` in its GHL conversation `K748W1xGJIiMFQdyrwyF`, body = the EOI receipt ("The slots are few and the triage is human ... CONTAINED. 3 rooms. 30 minutes. The truth."), sent right after the 23:48 registration.
- **Mechanism:** email sends via the GHL Conversations API (`ghl.sendEmailToAddress`), gated by `EMAIL_ENABLED==='true'` AND `ghl.isConfigured()`. GHL is configured (`GHL_API_KEY` + `GHL_LOCATION_ID` + `GHL_USER_ID` all SET in prod). `EMAIL_FROM` / `RESEND_API_KEY` are NOT used by this path, so their absence is a non-issue.

**Conclusion:** `/register` and `/eoi` DO send and deliver receipts. The "someone got no reply" complaint is narrow: the `/api/ghl/signup` (register-interest) path has zero `sendEmail` calls, plus the 12 June outage lost a submission before it reached GHL. This is NOT a platform-wide email outage. The biggest-risk framing in `00-MASTER` §Executive summary is superseded by this file.

## 2. GHL_* env vars, MIXED

| Var | Prod state | Effect |
|---|---|---|
| `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_USER_ID` | SET | Core GHL + email works |
| `CRON_SECRET` | SET | Cron auth works |
| Pipeline routing | HARDCODED in `CONTAINED_PIPELINES` (register/route.ts:213-215) | CONTAINED contacts route into the right pipeline+stage regardless of env |
| `GHL_PRE_EVENT_WORKFLOW_ID` | MISSING | Pre-event drip trigger (register/route.ts:305) is a silent no-op |
| `GHL_WELCOME_WORKFLOW_ID`, `GHL_NURTURE_WORKFLOWS` | MISSING | Welcome / nurture workflow triggers no-op |
| `GHL_WORKFLOW_{FUNDER,MEDIA,ORGANIZATION,SUPPORTER,LIVED_EXPERIENCE}` | MISSING | Role-based workflow triggers no-op |
| `GHL_{EVENT,FUNDER,PARTNER,STEWARD}_PIPELINE_ID`, `GHL_*_STAGE_NEW`, `GHL_PIPELINES`, `GHL_TAGS`, `GHL_CANONICAL`, `GHL_WEBHOOK_SECRET`, `GHL_API_BASE` | MISSING | Not used by the CONTAINED register path (hardcoded/defaulted); webhook secret absence weakens webhook auth |

**Conclusion:** registration receipts + pipeline placement work. The automated workflow LAYER (pre-event, welcome, nurture, role drips) is inert because no workflow IDs are set. This only matters if those GHL workflows actually exist; if they were never built in GHL there is nothing to point the IDs at. **Ben decision:** either build + wire the workflows, or rely on the cron-based drip design in file 21 (which is self-contained and needs no GHL workflow IDs). Set `GHL_WEBHOOK_SECRET` before depending on inbound GHL webhooks.

## 3. Adelaide booking capacity, NO SYSTEM SOURCE

- `tour_stops` has NO capacity/slots column. `local_stats` holds budget figures (`move`/`activation`/`stop_total`), not seating.
- The Adelaide row: venue "Tandanya · Reintegration Puzzle Conference", partner "Justice Reform Initiative + Tandanya", `date = 2026-06-15`, status "planning". Note this DB date (15 June, the conference) differs from the "23 June public launch" in the campaign docs, the two beats need reconciling.
- The ~70-75 slot figure in file 21 is an explicit assumption with no data behind it.

**Conclusion:** booking capacity is a physical-site fact only Ben/the site roster can supply. Needed inputs: daily public window, minutes per walk-through, changeover time, and whether two people can be in different rooms simultaneously (would roughly double throughput). Until then, every capacity-derived number in file 21 stays `[UNVERIFIED]`.

## Net effect on launch readiness
The plumbing is in better shape than the plan assumed. Email is on and the main funnel confirms to registrants. The remaining real gaps are: (a) the register-interest path has no receipt (narrow code fix, file 20 Defect B), (b) no durable-first capture (file 20 Defect A), (c) the automated workflow layer is unwired (Ben decision: GHL workflows vs cron drips), and (d) booking capacity is unknown (Ben input).
