import './globals.css';

export const metadata = {
  title: 'CodeVetter — AI agents that actually ship code',
  description: 'CodeVetter orchestrates AI coding agents in isolated workspaces. Review findings, manage PRs, and track progress — all from one desktop app.',
  openGraph: {
    title: 'CodeVetter — AI agents that actually ship code',
    description: 'Orchestrate AI coding agents in isolated workspaces. Review findings, manage PRs, and track progress — all from one desktop app.',
    url: 'https://codevetter.com',
    siteName: 'CodeVetter',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeVetter — AI agents that actually ship code',
    description: 'Orchestrate AI coding agents in isolated workspaces. Review findings, manage PRs, and track progress — all from one desktop app.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
