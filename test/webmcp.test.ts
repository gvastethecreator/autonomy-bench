import { describe, expect, it } from 'vite-plus/test';
import {
  buildGalleryTools,
  createModelContext,
  installModelContext,
  mcpText,
  registerGalleryWebMcp,
} from '../scripts/webmcp.mjs';

const pack = {
  suiteId: 'browser-autonomy-v2',
  suiteVersion: '2.1.0',
  rules: ['Use the exact prompt text for the requested level.'],
  output: { file: 'index.html', singleHtml: true },
  levels: { A: 'Raw', B: 'Autonomous', C: 'Showcase' },
  benchmarks: [
    {
      id: 'rollercoaster',
      title: 'Rollercoaster',
      category: '3d-interactive',
      prompts: {
        A: 'Create a first-person rollercoaster in a single HTML file.',
        B: 'Create a first-person rollercoaster in a single HTML file. Decide yourself.',
        C: 'Create a first-person rollercoaster in a single HTML file. Decide yourself. Showcase it.',
      },
    },
  ],
};

const catalog = {
  experiments: [{ id: 'rollercoaster', title: 'Rollercoaster' }],
  models: [{ id: 'grok-4.6' }],
  cells: [
    {
      experiment: 'rollercoaster',
      level: 'A',
      model: 'grok-4.6',
      date: '2026-08-24-010000',
      src: 'grok-4.6/rollercoaster-A/2026-08-24-010000/index.html',
      receiptSrc: 'grok-4.6/rollercoaster-A/2026-08-24-010000/receipt.json',
    },
  ],
};

type TakePatch = { experiment: string; level: string; model: string; mode: string };

function fakeHost() {
  let shown: TakePatch | null = null;
  const state: TakePatch = {
    experiment: 'rollercoaster',
    level: 'A',
    model: 'grok-4.6',
    mode: 'single',
  };
  return {
    getPack: () => pack,
    getCatalog: () => catalog,
    getState: () => ({ ...state }),
    showTake(next: TakePatch) {
      shown = next;
      Object.assign(state, next);
      return { ok: true, ...state };
    },
    async loadReceipt() {
      return { status: 'complete', requestedModel: 'grok-4.6' };
    },
    shown: () => shown,
  };
}

describe('createModelContext', () => {
  it('registers, lists, and executes a tool', async () => {
    const ctx = createModelContext();
    await ctx.registerTool({
      name: 'echo',
      description: 'Echo text',
      inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
      execute: (input: { text?: string } = {}) => mcpText({ text: input.text }),
    });
    const tools = await ctx.getTools();
    expect(tools.map((row) => row.name)).toEqual(['echo']);
    const raw = await ctx.executeTool({ name: 'echo' }, { text: 'hi' });
    expect(JSON.parse(raw).structuredContent).toEqual({ text: 'hi' });
  });

  it('rejects a duplicate name', async () => {
    const ctx = createModelContext();
    const tool = { name: 'echo', description: 'Echo', execute: () => ({}) };
    await ctx.registerTool(tool);
    await expect(ctx.registerTool(tool)).rejects.toThrow('already registered');
  });
});

describe('gallery WebMCP tools', () => {
  it('lists live benches and returns the frozen prompt', async () => {
    const tools = buildGalleryTools(fakeHost());
    const names = tools.map((tool) => tool.name);
    expect(names).toEqual([
      'list-benches',
      'get-bench-prompt',
      'list-takes',
      'show-take',
      'get-gallery-state',
      'get-receipt',
    ]);
    const listed = await tools[0].execute({});
    expect(listed.structuredContent.benches[0].id).toBe('rollercoaster');
    const prompt = await tools[1].execute({
      benchmark: 'rollercoaster',
      level: 'B',
    });
    expect(prompt.structuredContent.prompt).toBe(pack.benchmarks[0].prompts.B);
    expect(prompt.structuredContent.rules[0]).toContain('exact prompt');
  });

  it('filters published takes and shows one in the gallery host', async () => {
    const host = fakeHost();
    const tools = Object.fromEntries(buildGalleryTools(host).map((tool) => [tool.name, tool]));
    const takes = await tools['list-takes'].execute({ model: 'grok-4.6' });
    expect(takes.structuredContent.count).toBe(1);
    await tools['show-take'].execute({
      experiment: 'rollercoaster',
      level: 'C',
      model: 'grok-4.6',
      mode: 'single',
    });
    expect(host.shown()).toEqual({
      experiment: 'rollercoaster',
      level: 'C',
      model: 'grok-4.6',
      mode: 'single',
    });
    const receipt = await tools['get-receipt'].execute({});
    expect(receipt.structuredContent.status).toBe('complete');
  });

  it('installs tools on document.modelContext', async () => {
    const doc: {
      modelContext?: { getTools: () => Promise<Array<{ name: string }>> };
    } = {};
    const names = await registerGalleryWebMcp(fakeHost(), { document: doc });
    expect(names).toContain('list-benches');
    expect(doc.modelContext).toBeTruthy();
    const listed = await doc.modelContext!.getTools();
    expect(listed.map((row) => row.name)).toContain('get-bench-prompt');
    expect(installModelContext({ document: doc })).toBe(doc.modelContext);
  });
});
