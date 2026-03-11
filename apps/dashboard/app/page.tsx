import Link from 'next/link';
import { Badge, Box, Button, Card, Flex, Grid, Heading, Separator, Text } from '@radix-ui/themes';

const agents = [
  { name: 'Claude Code', color: '#d4a574' },
  { name: 'Cursor', color: '#00d4aa' },
  { name: 'Devin', color: '#a78bfa' },
  { name: 'Copilot', color: '#79c0ff' },
  { name: 'Windsurf', color: '#f97316' },
];

const features = [
  {
    title: 'Auto-Detect Agent PRs',
    body: 'Identifies agent-generated pull requests by author, branch prefix, commit markers, and PR body signals. Zero config required.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(56,139,253,0.12)" />
        <circle cx="20" cy="16" r="6" stroke="#388bfd" strokeWidth="1.5" fill="none">
          <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M10 30c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#388bfd" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="stroke-opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="30" cy="12" r="3" fill="#388bfd" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <path d="M28 12h4M30 10v4" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Approve or Block',
    body: 'Automatic APPROVE, REQUEST_CHANGES, or COMMENT based on score, severity, and your workspace rules. Agents get gated, humans get suggestions.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(63,185,80,0.12)" />
        <path d="M12 20l6 6 12-14" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" values="0 40;40 0" dur="1.5s" repeatCount="indefinite" />
        </path>
        <rect x="8" y="8" width="24" height="24" rx="4" stroke="#3fb950" strokeWidth="1.5" fill="none" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: 'Structured Output',
    body: 'Review results embedded as machine-readable JSON in PR comments. Agents parse them directly from the GitHub page — no API key needed.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(188,140,255,0.12)" />
        <text x="9" y="16" fill="#bc8cff" fontSize="9" fontFamily="monospace" opacity="0.8">{'{'}</text>
        <rect x="16" y="10" width="14" height="2" rx="1" fill="#bc8cff" opacity="0.5">
          <animate attributeName="width" values="14;10;14" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="16" width="10" height="2" rx="1" fill="#bc8cff" opacity="0.7">
          <animate attributeName="width" values="10;14;10" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="22" width="12" height="2" rx="1" fill="#bc8cff" opacity="0.5">
          <animate attributeName="width" values="12;8;12" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="9" y="30" fill="#bc8cff" fontSize="9" fontFamily="monospace" opacity="0.8">{'}'}</text>
      </svg>
    ),
  },
  {
    title: 'Re-review Loop',
    body: 'When agents push fixes, CodeVetter re-reviews and shows what was resolved vs. what remains. Tracks the full review-fix-review cycle.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(210,153,34,0.12)" />
        <path d="M26 14a8 8 0 1 1-12 0" stroke="#d29922" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="3s" repeatCount="indefinite" />
        </path>
        <polygon points="26,11 26,17 30,14" fill="#d29922">
          <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="3s" repeatCount="indefinite" />
        </polygon>
      </svg>
    ),
  },
  {
    title: 'Agent-Tuned Prompts',
    body: 'Reviews agent code differently — flags hallucinated APIs, over-engineering, copy-paste artifacts, and hardcoded secrets. Returns concrete fix snippets.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(248,81,73,0.12)" />
        <circle cx="20" cy="18" r="8" stroke="#f85149" strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="18" r="3" fill="#f85149" opacity="0.6">
          <animate attributeName="r" values="3;4;3" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <line x1="26" y1="24" x2="32" y2="30" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Status API',
    body: 'Agents poll review status programmatically. Get score, action, and findings in one API call. Build review gates into any CI pipeline.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(56,139,253,0.08)" />
        <path d="M10 28l5-8 5 4 5-10 5 6" stroke="#388bfd" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" values="0 50;50 0" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="10" cy="28" r="2" fill="#388bfd" opacity="0.5" />
        <circle cx="15" cy="20" r="2" fill="#388bfd" opacity="0.5" />
        <circle cx="20" cy="24" r="2" fill="#388bfd" opacity="0.5" />
        <circle cx="25" cy="14" r="2" fill="#388bfd" opacity="0.5" />
        <circle cx="30" cy="20" r="2" fill="#388bfd" opacity="0.5" />
      </svg>
    ),
  },
];

const coreSignals = [
  { label: 'Agents Supported', value: '5+' },
  { label: 'Auto-Detection Signals', value: '4' },
  { label: 'Review Actions', value: '3' },
];

/* Inline SVG hero graphic — animated agent → CodeVetter → GitHub flow */
function HeroGraphic() {
  return (
    <svg
      viewBox="0 0 720 200"
      fill="none"
      style={{ width: '100%', maxWidth: 720, height: 'auto', marginTop: 8 }}
    >
      {/* Background grid */}
      {Array.from({ length: 15 }).map((_, i) => (
        <line key={`vg-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="200" stroke="rgba(56,139,253,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`hg-${i}`} x1="0" y1={i * 50} x2="720" y2={i * 50} stroke="rgba(56,139,253,0.06)" strokeWidth="1" />
      ))}

      {/* Agent node cluster (left) */}
      <g>
        <circle cx="80" cy="50" r="18" fill="rgba(212,165,116,0.15)" stroke="#d4a574" strokeWidth="1">
          <animate attributeName="r" values="18;20;18" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="80" y="54" textAnchor="middle" fill="#d4a574" fontSize="8" fontWeight="600">Claude</text>

        <circle cx="60" cy="110" r="16" fill="rgba(0,212,170,0.12)" stroke="#00d4aa" strokeWidth="1">
          <animate attributeName="r" values="16;18;16" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <text x="60" y="114" textAnchor="middle" fill="#00d4aa" fontSize="8" fontWeight="600">Cursor</text>

        <circle cx="100" cy="155" r="15" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1">
          <animate attributeName="r" values="15;17;15" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="159" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="600">Devin</text>
      </g>

      {/* Flowing data lines: agents → CodeVetter */}
      <g>
        <path d="M98 50 Q200 50 280 100" stroke="#d4a574" strokeWidth="1" fill="none" opacity="0.4">
          <animate attributeName="stroke-dasharray" values="0,200;200,0" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M76 110 Q180 110 280 100" stroke="#00d4aa" strokeWidth="1" fill="none" opacity="0.4">
          <animate attributeName="stroke-dasharray" values="0,200;200,0" dur="2.3s" repeatCount="indefinite" />
        </path>
        <path d="M115 155 Q200 155 280 100" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.4">
          <animate attributeName="stroke-dasharray" values="0,200;200,0" dur="2.6s" repeatCount="indefinite" />
        </path>

        {/* Animated particles on the lines */}
        <circle r="3" fill="#d4a574">
          <animateMotion dur="2s" repeatCount="indefinite" path="M98 50 Q200 50 280 100" />
        </circle>
        <circle r="3" fill="#00d4aa">
          <animateMotion dur="2.3s" repeatCount="indefinite" path="M76 110 Q180 110 280 100" />
        </circle>
        <circle r="3" fill="#a78bfa">
          <animateMotion dur="2.6s" repeatCount="indefinite" path="M115 155 Q200 155 280 100" />
        </circle>
      </g>

      {/* CodeVetter hub (center) */}
      <g>
        <rect x="280" y="65" width="160" height="70" rx="12" fill="rgba(56,139,253,0.08)" stroke="#388bfd" strokeWidth="1.5" />
        <circle cx="310" cy="100" r="14" fill="rgba(56,139,253,0.15)" stroke="#388bfd" strokeWidth="1">
          <animate attributeName="fill-opacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Shield icon */}
        <path d="M310 90v-2a1 1 0 011-1h0a1 1 0 011 1v2m-4 0h6a1 1 0 011 1v6a3 3 0 01-4 2.8A3 3 0 01306 97v-6a1 1 0 011-1z" stroke="#388bfd" strokeWidth="1.2" fill="none" />
        <path d="M308 96l2 2 4-4" stroke="#388bfd" strokeWidth="1" fill="none" strokeLinecap="round" />

        <text x="350" y="96" fill="#e6edf3" fontSize="11" fontWeight="700">CodeVetter</text>
        <text x="350" y="110" fill="#8b949e" fontSize="8">score &middot; gate &middot; approve</text>
      </g>

      {/* Output flow: CodeVetter → GitHub */}
      <g>
        <path d="M440 100 Q520 100 560 70" stroke="#3fb950" strokeWidth="1.5" fill="none" opacity="0.5">
          <animate attributeName="stroke-dasharray" values="0,150;150,0" dur="1.8s" repeatCount="indefinite" />
        </path>
        <path d="M440 100 Q520 100 560 130" stroke="#f85149" strokeWidth="1.5" fill="none" opacity="0.5">
          <animate attributeName="stroke-dasharray" values="0,150;150,0" dur="1.8s" repeatCount="indefinite" />
        </path>

        {/* Approve particle */}
        <circle r="3" fill="#3fb950">
          <animateMotion dur="1.8s" repeatCount="indefinite" path="M440 100 Q520 100 560 70" />
        </circle>
        {/* Reject particle */}
        <circle r="3" fill="#f85149">
          <animateMotion dur="1.8s" repeatCount="indefinite" path="M440 100 Q520 100 560 130" />
        </circle>
      </g>

      {/* Approve badge */}
      <g>
        <rect x="560" y="50" width="120" height="36" rx="8" fill="rgba(63,185,80,0.1)" stroke="#3fb950" strokeWidth="1" />
        <path d="M578 68l4 4 8-10" stroke="#3fb950" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <text x="596" y="72" fill="#3fb950" fontSize="10" fontWeight="600">APPROVE</text>
      </g>

      {/* Request Changes badge */}
      <g>
        <rect x="560" y="114" width="120" height="36" rx="8" fill="rgba(248,81,73,0.1)" stroke="#f85149" strokeWidth="1" />
        <text x="580" y="130" fill="#f85149" fontSize="14" fontWeight="700">!</text>
        <text x="593" y="136" fill="#f85149" fontSize="9" fontWeight="600">CHANGES</text>
      </g>

      {/* Re-review loop arrow (bottom) */}
      <g opacity="0.35">
        <path d="M580 150 Q580 180 440 180 Q300 180 300 135" stroke="#d29922" strokeWidth="1" fill="none" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" values="0;-14" dur="1s" repeatCount="indefinite" />
        </path>
        <polygon points="297,140 303,140 300,133" fill="#d29922" />
        <text x="420" y="176" textAnchor="middle" fill="#d29922" fontSize="7">re-review loop</text>
      </g>
    </svg>
  );
}

/* Animated code diff graphic for the "how it works" section */
function CodeDiffGraphic() {
  return (
    <svg viewBox="0 0 400 180" fill="none" style={{ width: '100%', maxWidth: 400, height: 'auto' }}>
      <rect width="400" height="180" rx="8" fill="rgba(15,23,42,0.8)" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
      {/* Title bar */}
      <rect width="400" height="28" rx="8" fill="rgba(30,41,59,0.6)" />
      <circle cx="16" cy="14" r="4" fill="#f85149" opacity="0.7" />
      <circle cx="30" cy="14" r="4" fill="#d29922" opacity="0.7" />
      <circle cx="44" cy="14" r="4" fill="#3fb950" opacity="0.7" />
      <text x="200" y="18" textAnchor="middle" fill="#8b949e" fontSize="9">review-output.md</text>

      {/* Score line */}
      <text x="16" y="50" fill="#3fb950" fontSize="10" fontFamily="monospace">## Score: 85/100</text>
      <rect x="160" y="40" width="60" height="14" rx="3" fill="rgba(63,185,80,0.15)" stroke="#3fb950" strokeWidth="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </rect>
      <text x="168" y="51" fill="#3fb950" fontSize="8" fontWeight="600">APPROVE</text>

      {/* Finding lines with typing animation */}
      <g>
        <text x="16" y="72" fill="#f85149" fontSize="9" fontFamily="monospace">- Hallucinated API: fetch.retry()</text>
        <rect x="16" y="63" width="0" height="12" fill="rgba(248,81,73,0.08)">
          <animate attributeName="width" values="0;250;250" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>
      <g>
        <text x="16" y="90" fill="#3fb950" fontSize="9" fontFamily="monospace">+ Suggestion: use fetchWithRetry()</text>
        <rect x="16" y="81" width="0" height="12" fill="rgba(63,185,80,0.06)">
          <animate attributeName="width" values="0;0;260;260" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* JSON block */}
      <text x="16" y="115" fill="#6e7681" fontSize="8" fontFamily="monospace">{'<!-- codevetter:begin'}</text>
      <text x="16" y="128" fill="#bc8cff" fontSize="8" fontFamily="monospace">{'{"score":85,"action":"APPROVE",'}</text>
      <text x="16" y="141" fill="#bc8cff" fontSize="8" fontFamily="monospace">{' "findings":[...]}'}</text>
      <text x="16" y="154" fill="#6e7681" fontSize="8" fontFamily="monospace">{'codevetter:end -->'}</text>

      {/* Scanning line */}
      <line x1="0" y1="0" x2="400" y2="0" stroke="#388bfd" strokeWidth="2" opacity="0.3">
        <animate attributeName="y1" values="28;180;28" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y2" values="28;180;28" dur="4s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="shell dashboard-home">
      <Card size="2" className="chrome-bar home-topbar">
        <Flex align="center" justify="between" wrap="wrap" gap="2">
          <Flex align="center" gap="2">
            <Box className="dot-mark" />
            <Text size="2" weight="bold">
              CodeVetter
            </Text>
          </Flex>
          <Flex gap="2" wrap="wrap">
            <Button asChild size="2" variant="soft" color="gray">
              <Link href="/onboarding">Get Started</Link>
            </Button>
            <Button asChild size="2">
              <Link href="/login">Sign In</Link>
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Grid columns={{ initial: '1', md: '1' }} gap="3" mt="3">
        <Card size="4" className="hero home-hero">
          <Flex direction="column" gap="4" align="center" style={{ textAlign: 'center' }}>
            <Flex gap="2" wrap="wrap" justify="center">
              <Badge color="blue" variant="soft" size="2">Agent-First Code Review</Badge>
              <Badge color="green" variant="soft" size="2">GitHub Native</Badge>
            </Flex>
            <Heading size="9" className="home-title" style={{ maxWidth: 820 }}>
              The quality gate for AI-generated code
            </Heading>
            <Text size="3" className="home-copy" style={{ maxWidth: 680, lineHeight: 1.75 }}>
              CodeVetter reviews pull requests from Claude Code, Cursor, Devin, and other AI agents.
              It auto-detects agent PRs, runs targeted review, and approves or blocks — directly on the GitHub PR page.
            </Text>
            <Flex gap="2" wrap="wrap" justify="center">
              <Button asChild size="3" className="home-primary-btn">
                <Link href="/login">Start Reviewing</Link>
              </Button>
              <Button asChild variant="soft" color="gray" size="3" className="home-secondary-btn">
                <Link href="/onboarding">Install GitHub App</Link>
              </Button>
            </Flex>

            {/* Agent logos row */}
            <Flex gap="3" wrap="wrap" justify="center" mt="2">
              {agents.map(agent => (
                <Flex key={agent.name} align="center" gap="1" style={{ opacity: 0.7 }}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: agent.color,
                    }}
                  />
                  <Text size="1" style={{ color: agent.color, fontWeight: 500 }}>
                    {agent.name}
                  </Text>
                </Flex>
              ))}
            </Flex>

            <Separator size="4" />

            <Grid columns={{ initial: '1', sm: '3' }} gap="2" width="100%" style={{ maxWidth: 600 }}>
              {coreSignals.map(item => (
                <Card key={item.label} size="2" className="home-signal-card">
                  <Flex direction="column" gap="1">
                    <Text size="1" className="home-signal-label">
                      {item.label}
                    </Text>
                    <Heading size="5" className="home-signal-value">
                      {item.value}
                    </Heading>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Flex>
        </Card>
      </Grid>

      {/* Animated hero diagram */}
      <Box mt="4">
        <Card size="3" className="home-pillar-card" style={{ overflow: 'hidden' }}>
          <Flex direction="column" gap="3" align="center">
            <Text size="1" className="home-signal-label" style={{ letterSpacing: '0.1em' }}>
              HOW IT WORKS
            </Text>
            <HeroGraphic />
          </Flex>
        </Card>
      </Box>

      {/* Code diff preview */}
      <Grid columns={{ initial: '1', md: '5fr 4fr' }} gap="3" mt="4">
        <Card size="3" className="home-pillar-card">
          <Flex direction="column" gap="3">
            <Heading size="5" className="home-pillar-title">
              Machine-readable reviews
            </Heading>
            <Text size="2" className="home-pillar-copy" style={{ lineHeight: 1.7 }}>
              Every review comment includes structured JSON in an HTML comment block.
              Agents parse findings, scores, and actions directly from the PR page — no separate API call required.
              Humans see clean markdown. Agents see structured data. Same comment.
            </Text>
          </Flex>
        </Card>
        <Card size="3" className="home-pillar-card" style={{ overflow: 'hidden', padding: 0 }}>
          <Box p="3">
            <CodeDiffGraphic />
          </Box>
        </Card>
      </Grid>

      {/* Feature grid */}
      <Box mt="4">
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
          {features.map(item => (
            <Card key={item.title} size="3" className="home-pillar-card">
              <Flex direction="column" gap="3">
                {item.icon}
                <Heading size="4" className="home-pillar-title">
                  {item.title}
                </Heading>
                <Text size="2" className="home-pillar-copy" style={{ lineHeight: 1.7 }}>
                  {item.body}
                </Text>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Box>

      {/* Bottom CTA */}
      <Box mt="4" mb="4">
        <Card size="4" className="home-hero" style={{ textAlign: 'center' }}>
          <Flex direction="column" gap="3" align="center">
            <Heading size="7" className="home-title">
              Stop merging unreviewed agent code
            </Heading>
            <Text size="3" className="home-copy" style={{ maxWidth: 560, lineHeight: 1.7 }}>
              Install the GitHub App, connect your repos, and every agent PR
              gets reviewed automatically. Takes two minutes.
            </Text>
            <Button asChild size="3" className="home-primary-btn">
              <Link href="/onboarding">Get Started Free</Link>
            </Button>
          </Flex>
        </Card>
      </Box>
    </main>
  );
}
