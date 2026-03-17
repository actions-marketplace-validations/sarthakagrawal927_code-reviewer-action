pub mod doc;
pub mod merge;
pub mod parser;
pub mod schema;

use automerge::AutoCommit;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;

/// Maximum number of entries in the document cache.
const MAX_CACHE_SIZE: usize = 50;
/// Time-to-live for cache entries (30 minutes).
const CACHE_TTL: std::time::Duration = std::time::Duration::from_secs(30 * 60);

/// Global cache of loaded Automerge documents, keyed by review_id.
/// Each entry stores the document and the last access time for TTL eviction.
pub type DocCache = Arc<Mutex<HashMap<String, (AutoCommit, Instant)>>>;

/// Create a new empty document cache.
pub fn new_doc_cache() -> DocCache {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Remove entries older than `CACHE_TTL` from the cache and enforce `MAX_CACHE_SIZE`.
/// Called lazily at the start of every cache access.
pub fn cleanup_cache(docs: &mut HashMap<String, (AutoCommit, Instant)>) {
    let now = Instant::now();

    // Evict expired entries
    docs.retain(|_, (_, last_access)| now.duration_since(*last_access) < CACHE_TTL);

    // If still over max size, evict oldest entries
    while docs.len() > MAX_CACHE_SIZE {
        if let Some(oldest_key) = docs
            .iter()
            .min_by_key(|(_, (_, ts))| *ts)
            .map(|(k, _)| k.clone())
        {
            docs.remove(&oldest_key);
        } else {
            break;
        }
    }
}

/// Build the on-disk path for a review document:
/// `<repo_path>/.codevetter/review-<review_id>.automerge`
pub fn doc_path(repo_path: &str, review_id: &str) -> std::path::PathBuf {
    std::path::PathBuf::from(repo_path)
        .join(".codevetter")
        .join(format!("review-{review_id}.automerge"))
}
