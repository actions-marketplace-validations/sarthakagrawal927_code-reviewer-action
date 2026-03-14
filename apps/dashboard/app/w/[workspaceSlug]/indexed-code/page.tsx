import { notFound } from 'next/navigation';
import { getWorkspaceBySlug, platformFetch } from '../../../../lib/platform';

type Repo = {
  id: string;
  fullName: string;
  defaultBranch?: string;
  installationId?: string;
  updatedAt: string;
};

type IndexingStats = {
  totalFiles: number;
  totalChunks: number;
  languages: Record<string, number>;
  lastIndexedAt?: string;
};

function timeAgo(dateStr: string): string {
  try {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return dateStr;
  }
}

const LANG_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3572a5',
  go: '#00add8',
  rust: '#dea584',
  java: '#b07219',
  ruby: '#701516',
  css: '#563d7c',
  html: '#e34c26',
  markdown: '#8b949e',
};

export default async function IndexedCodePage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    notFound();
  }

  const repositoriesResponse = await platformFetch<{ repositories: Repo[] }>(
    `/v1/workspaces/${encodeURIComponent(workspace.id)}/repositories`
  );
  const repos = repositoriesResponse.repositories;

  // Fetch indexing stats per repo
  const repoStats = new Map<string, IndexingStats>();
  let totalFiles = 0;
  let totalChunks = 0;
  const globalLangs: Record<string, number> = {};

  for (const repo of repos) {
    try {
      const res = await platformFetch<{ stats: IndexingStats }>(
        `/v1/workspaces/${encodeURIComponent(workspace.id)}/repositories/${encodeURIComponent(repo.id)}/indexing/stats`
      );
      repoStats.set(repo.id, res.stats);
      totalFiles += res.stats.totalFiles;
      totalChunks += res.stats.totalChunks;
      for (const [lang, count] of Object.entries(res.stats.languages)) {
        globalLangs[lang] = (globalLangs[lang] ?? 0) + count;
      }
    } catch {
      // Stats not available for this repo
    }
  }

  // Compute language breakdown percentages
  const langEntries = Object.entries(globalLangs).sort((a, b) => b[1] - a[1]);
  const langTotal = langEntries.reduce((sum, [, c]) => sum + c, 0);
  const langBreakdown = langEntries.map(([lang, count]) => ({
    label: lang.charAt(0).toUpperCase() + lang.slice(1),
    pct: langTotal > 0 ? Math.round((count / langTotal) * 100) : 0,
    color: LANG_COLORS[lang.toLowerCase()] ?? '#6e7681',
  }));

  const indexedRepoCount = Array.from(repoStats.values()).filter(s => s.totalFiles > 0).length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Codebase Index</h1>
          <p>Indexed files and code chunks for AI-powered code review context.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stat-grid-4">
        <div className="stat-card">
          <div className="stat-card-label">Indexed Files</div>
          <div className="stat-card-value">
            {totalFiles > 0 ? totalFiles.toLocaleString() : '—'}
          </div>
          <div className="stat-card-change">{indexedRepoCount} of {repos.length} repos indexed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Code Chunks</div>
          <div className="stat-card-value">
            {totalChunks > 0 ? totalChunks.toLocaleString() : '—'}
          </div>
          <div className="stat-card-change">Tree-sitter parsed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Languages</div>
          <div className="stat-card-value">
            {langEntries.length > 0 ? langEntries.length : '—'}
          </div>
          <div className="stat-card-change">
            {langEntries.length > 0 ? langEntries.slice(0, 3).map(([l]) => l).join(', ') : 'No data'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Repositories</div>
          <div className="stat-card-value">
            {repos.length > 0 ? repos.length : '—'}
          </div>
          <div className="stat-card-change">
            {indexedRepoCount > 0 ? `${indexedRepoCount} indexed` : 'None indexed'}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="two-col">
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Indexed Repositories</h2>
                <p>{repos.length} repositories</p>
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Repository / Branch</th>
                    <th>Files</th>
                    <th>Chunks</th>
                    <th>Last Indexed</th>
                  </tr>
                </thead>
                <tbody>
                  {repos.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={4}>No repositories connected yet.</td>
                    </tr>
                  ) : (
                    repos.map(repo => {
                      const stats = repoStats.get(repo.id);
                      return (
                        <tr key={repo.id}>
                          <td>
                            <div className="col-primary" style={{ fontSize: '13px', marginBottom: '2px' }}>
                              {repo.fullName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                              {repo.defaultBranch || 'main'}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                            {stats?.totalFiles ?? '—'}
                          </td>
                          <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                            {stats?.totalChunks ?? '—'}
                          </td>
                          <td style={{ color: 'var(--text-subtle)', fontSize: '12px' }}>
                            {stats?.lastIndexedAt ? timeAgo(stats.lastIndexedAt) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right panel: Language breakdown */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2>Language Breakdown</h2>
              <p>By indexed files</p>
            </div>
            <div className="card-body">
              {langBreakdown.length > 0 ? (
                <>
                  <div className="bar-chart-row">
                    {langBreakdown.map(seg => (
                      <div
                        key={seg.label}
                        className="bar-chart-seg"
                        style={{ width: `${Math.max(seg.pct, 2)}%`, background: seg.color }}
                        title={`${seg.label}: ${seg.pct}%`}
                      />
                    ))}
                  </div>
                  <div className="bar-chart-legend">
                    {langBreakdown.map(seg => (
                      <div key={seg.label} className="bar-chart-legend-item">
                        <div className="bar-chart-legend-left">
                          <span className="bar-chart-legend-dot" style={{ background: seg.color }} />
                          {seg.label}
                        </div>
                        <span className="bar-chart-legend-pct">{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-subtle)', padding: '16px 0' }}>
                  No indexed data yet. Trigger an indexing run to see language breakdown.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Index Summary</h2>
            </div>
            <div className="card-body">
              <div className="index-status-panel" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                <div className="index-status-row">
                  <span className="index-status-key">Total Files</span>
                  <span className="index-status-val">{totalFiles > 0 ? totalFiles.toLocaleString() : '—'}</span>
                </div>
                <div className="index-status-row">
                  <span className="index-status-key">Total Chunks</span>
                  <span className="index-status-val">{totalChunks > 0 ? totalChunks.toLocaleString() : '—'}</span>
                </div>
                <div className="index-status-row">
                  <span className="index-status-key">Strategy</span>
                  <span className="index-status-val">tree-sitter</span>
                </div>
                <div className="index-status-row">
                  <span className="index-status-key">Embeddings</span>
                  <span className="index-status-val" style={{ color: 'var(--text-subtle)' }}>Not configured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
