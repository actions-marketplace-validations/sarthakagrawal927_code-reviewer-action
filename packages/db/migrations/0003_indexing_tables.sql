-- Indexing tables: file-level tracking and semantic chunks for codebase search

CREATE TABLE IF NOT EXISTS indexed_files (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  source_ref TEXT NOT NULL,
  path TEXT NOT NULL,
  blob_sha TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  language TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  chunk_strategy TEXT NOT NULL DEFAULT 'tree-sitter',
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (repository_id, source_ref, path)
);

CREATE TABLE IF NOT EXISTS semantic_chunks (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  source_ref TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_content_sha256 TEXT NOT NULL,
  language TEXT NOT NULL,
  symbol_kind TEXT NOT NULL DEFAULT 'unknown',
  symbol_name TEXT,
  chunk_ordinal INTEGER NOT NULL DEFAULT 0,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indexed_files_repo ON indexed_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_indexed_files_repo_ref ON indexed_files(repository_id, source_ref);
CREATE INDEX IF NOT EXISTS idx_semantic_chunks_repo ON semantic_chunks(repository_id);
CREATE INDEX IF NOT EXISTS idx_semantic_chunks_repo_ref ON semantic_chunks(repository_id, source_ref);
CREATE INDEX IF NOT EXISTS idx_semantic_chunks_symbol ON semantic_chunks(symbol_name) WHERE symbol_name IS NOT NULL;
