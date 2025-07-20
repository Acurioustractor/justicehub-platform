-- API Keys table for external partner access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  key TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes JSONB NOT NULL,
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  last_used_at TIMESTAMP,
  last_used_ip TEXT,
  expires_at TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for API keys
CREATE INDEX idx_api_key_org ON api_keys(organization_id);
CREATE INDEX idx_api_key ON api_keys(key);
CREATE INDEX idx_api_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_key_active ON api_keys(is_active);

-- API Key usage logs
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id TEXT PRIMARY KEY,
  api_key_id TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for usage logs
CREATE INDEX idx_usage_api_key ON api_key_usage_logs(api_key_id);
CREATE INDEX idx_usage_created ON api_key_usage_logs(created_at);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB NOT NULL,
  headers JSONB,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  last_triggered_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for webhooks
CREATE INDEX idx_webhook_org ON webhooks(organization_id);
CREATE INDEX idx_webhook_active ON webhooks(is_active);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response JSONB,
  status_code INTEGER,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for webhook deliveries
CREATE INDEX idx_delivery_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_delivery_created ON webhook_deliveries(created_at);
CREATE INDEX idx_delivery_retry ON webhook_deliveries(next_retry_at);

-- Update trigger for API keys
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for webhooks
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();