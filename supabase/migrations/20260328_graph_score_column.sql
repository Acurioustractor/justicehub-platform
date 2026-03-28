-- Add graph_score column to organizations for cross-linkage scoring
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS graph_score numeric DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_organizations_graph_score ON organizations(graph_score) WHERE graph_score > 0;
