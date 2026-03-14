'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { clientApiRequest } from './client-api';

type TopbarProps = {
  workspaceSlug: string;
  workspaceId: string;
};

type Repo = {
  id: string;
  fullName: string;
};

const PAGE_LABELS: Record<string, string> = {
  overview: 'Overview',
  repositories: 'Repositories',
  'pull-requests': 'Pull Requests',
  'indexed-code': 'Indexed Code',
  members: 'Members',
  audit: 'Audit'
};

export function Topbar({ workspaceSlug, workspaceId }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split('/').filter(Boolean);
  const rest = segments.slice(2);
  const currentSegment = rest[rest.length - 1] ?? '';
  const pageName = PAGE_LABELS[currentSegment] ?? currentSegment;

  const [query, setQuery] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch repos once on mount
  useEffect(() => {
    let cancelled = false;
    clientApiRequest(`/v1/workspaces/${encodeURIComponent(workspaceId)}/repositories`)
      .then((data) => {
        if (!cancelled && data && typeof data === 'object' && 'repositories' in data) {
          setRepos((data as { repositories: Repo[] }).repositories);
        }
      })
      .catch(() => {
        // silently ignore — search just won't work
      });
    return () => { cancelled = true; };
  }, [workspaceId]);

  const filtered = query.trim()
    ? repos.filter((r) => r.fullName.toLowerCase().includes(query.toLowerCase()))
    : [];

  const showDropdown = open && query.trim().length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navigateToRepo = useCallback((repo: Repo) => {
    setOpen(false);
    setQuery('');
    router.push(`/w/${workspaceSlug}/repositories`);
  }, [router, workspaceSlug]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filtered.length) {
      e.preventDefault();
      navigateToRepo(filtered[activeIndex]);
    }
  }, [showDropdown, filtered, activeIndex, navigateToRepo]);

  return (
    <header className="topbar">
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        <Link href={`/w/${workspaceSlug}/overview`}>{workspaceSlug}</Link>
        <span className="crumb-sep">›</span>
        <span className="crumb-current">{pageName}</span>
      </nav>

      <div className="topbar-spacer" />

      <div className="topbar-search-wrap" ref={wrapperRef}>
        <div className="topbar-search">
          <span className="topbar-search-icon">⌕</span>
          <input
            type="search"
            placeholder="Search repositories..."
            aria-label="Search repositories"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => { if (query.trim()) setOpen(true); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        {showDropdown && (
          <div className="topbar-search-dropdown" role="listbox">
            {filtered.length === 0 ? (
              <div className="topbar-search-empty">No repositories found</div>
            ) : (
              filtered.slice(0, 8).map((repo, i) => {
                const parts = repo.fullName.split('/');
                const name = parts[parts.length - 1] ?? repo.fullName;
                const owner = parts.length > 1 ? parts[0] : '';
                return (
                  <button
                    key={repo.id}
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`topbar-search-result${i === activeIndex ? ' active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => navigateToRepo(repo)}
                  >
                    <span className="topbar-search-result-icon">⊡</span>
                    <span className="topbar-search-result-text">
                      <span className="topbar-search-result-name">{name}</span>
                      {owner && <span className="topbar-search-result-owner">{owner}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <button className="topbar-icon-btn" aria-label="Notifications" type="button">
        🔔
      </button>

      <button className="topbar-icon-btn" aria-label="Help" type="button">
        ?
      </button>
    </header>
  );
}
