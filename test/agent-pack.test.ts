import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { AGENT_RULES, buildAgentPack } from '../scripts/agent-pack.mjs';
import { writeAgentPack } from '../scripts/gallery-publish.mjs';

const suite = {
  id: 'browser-autonomy-v2',
  version: '2.1.0',
  promptLevels: { A: { name: 'Raw' }, B: { name: 'Autonomous' }, C: { name: 'Showcase' } },
  benchmarks: [
    {
      id: 'rollercoaster',
      title: 'Rollercoaster',
      category: '3d-interactive',
      outputContract: { primary: 'index.html', singleHtml: true },
      prompts: {
        A: 'Create a first-person rollercoaster in a single HTML file.',
        B: 'Create a first-person rollercoaster in a single HTML file. Decide yourself.',
        C: 'Create a first-person rollercoaster in a single HTML file. Decide yourself. Showcase it.',
      },
    },
  ],
};

describe('agent pack', () => {
  it('copies live A/B/C prompts and rules into agent.json and llms.txt', () => {
    const pack = buildAgentPack(suite);
    expect(pack.json.audience).toBe('coding-agent');
    expect(pack.json.benchmarks).toHaveLength(1);
    expect(pack.json.benchmarks[0].prompts.A).toBe(suite.benchmarks[0].prompts.A);
    expect(pack.json.benchmarks[0].prompts.C).toBe(suite.benchmarks[0].prompts.C);
    expect(pack.json.rules).toEqual(AGENT_RULES);
    expect(pack.llms).toContain(suite.benchmarks[0].prompts.B);
    expect(pack.llms).toContain('/agent.json');
    expect(pack.llms).toContain('document.modelContext');
    expect(pack.llms).toContain('get-bench-prompt');
    const dir = mkdtempSync(join(tmpdir(), 'ab-agent-'));
    writeAgentPack(dir, suite);
    const written = JSON.parse(readFileSync(join(dir, 'agent.json'), 'utf8'));
    expect(written.benchmarks[0].id).toBe('rollercoaster');
    const llms = readFileSync(join(dir, 'llms.txt'), 'utf8');
    expect(llms.startsWith('# Autonomy Bench\n')).toBe(true);
    expect(llms).toContain('Do not expand');
  });
});
