import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectAgent } from './agentDetection';

describe('detectAgent', () => {
  it('detects bot accounts', () => {
    const result = detectAgent({ authorLogin: 'renovate[bot]' });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'renovate');
  });

  it('detects devin-ai-integration', () => {
    const result = detectAgent({ authorLogin: 'devin-ai-integration' });
    assert.equal(result.isAgentAuthored, true);
  });

  it('detects Claude Code PR body marker', () => {
    const result = detectAgent({ prBody: 'Some PR\n\nGenerated with [Claude Code](https://claude.ai)' });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'claude-code');
  });

  it('detects explicit agent marker in PR body', () => {
    const result = detectAgent({ prBody: '<!-- agent:cursor -->\nFix bug' });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'cursor');
  });

  it('detects branch prefix claude/', () => {
    const result = detectAgent({ headRef: 'claude/fix-auth-bug' });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'claude-code');
  });

  it('detects branch prefix devin/', () => {
    const result = detectAgent({ headRef: 'devin/implement-feature' });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'devin');
  });

  it('detects commit co-author pattern', () => {
    const result = detectAgent({
      commitMessages: ['Fix login\n\nCo-Authored-By: Claude <noreply@anthropic.com>']
    });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'claude-code');
  });

  it('returns false for human PRs', () => {
    const result = detectAgent({
      authorLogin: 'sarthakagrawal',
      prBody: 'Fixed a bug in the login flow',
      headRef: 'feature/login-fix',
    });
    assert.equal(result.isAgentAuthored, false);
    assert.equal(result.agentName, undefined);
  });

  it('returns false with no input', () => {
    const result = detectAgent({});
    assert.equal(result.isAgentAuthored, false);
  });

  it('prioritizes bot account over other signals', () => {
    const result = detectAgent({
      authorLogin: 'dependabot[bot]',
      headRef: 'claude/something',
    });
    assert.equal(result.isAgentAuthored, true);
    assert.equal(result.agentName, 'dependabot');
  });
});
