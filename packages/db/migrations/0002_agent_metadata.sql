-- Agent-first pivot: add agent detection, review gating, and re-review loop fields

ALTER TABLE pull_requests ADD COLUMN is_agent_authored BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pull_requests ADD COLUMN agent_name TEXT;

ALTER TABLE review_runs ADD COLUMN review_mode TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE review_runs ADD COLUMN review_action TEXT NOT NULL DEFAULT 'COMMENT';
ALTER TABLE review_runs ADD COLUMN parent_review_run_id TEXT REFERENCES review_runs(id);

ALTER TABLE review_findings ADD COLUMN suggestion TEXT;
ALTER TABLE review_findings ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE review_findings ADD COLUMN finding_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_review_runs_parent ON review_runs(parent_review_run_id) WHERE parent_review_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_review_findings_fingerprint ON review_findings(finding_fingerprint) WHERE finding_fingerprint IS NOT NULL;
