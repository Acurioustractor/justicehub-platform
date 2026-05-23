-- Remote control signals for the Adelaide exhibition kiosk.
--
-- A venue operator sends a signal from /admin/kiosk/control (PIN-gated);
-- the kiosk polls /api/kiosk/control-signal every 5s and reacts when the
-- latest signal is newer than its last-seen timestamp.
--
-- Signal types:
--   reset  -> navigate to /kiosk (return to hook)
--   reload -> hard reload current page (useful after content changes)
--   note   -> show a transient message at top of screen

CREATE TABLE IF NOT EXISTS kiosk_control_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text NOT NULL CHECK (signal_type IN ('reset', 'reload', 'note')),
  payload jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by text
);

CREATE INDEX IF NOT EXISTS idx_kiosk_control_signals_sent_at
  ON kiosk_control_signals (sent_at DESC);

COMMENT ON TABLE kiosk_control_signals IS
  'Remote control signals for the Adelaide exhibition kiosk. Kiosk polls the latest sent_at every 5s and reacts when newer than its last-seen timestamp.';
