const SITE = 'https://benchmark.gvaste.dev';

export const AGENT_RULES = [
  'Use the exact prompt text for the requested level. Do not expand, clarify, or add hidden requirements.',
  'One cell is one benchmark, one prompt level, one model, and one attempt.',
  'Do not read sibling takes or published gallery HTML while producing a take.',
  'Return one self-contained HTML file named index.html. No build step.',
  'Unknown provenance stays the string not captured. Do not invent timings or token counts.',
];

export function buildAgentPack(suite) {
  const benchmarks = (suite?.benchmarks || []).map((b) => ({
    id: b.id,
    title: b.title,
    category: b.category || '',
    output: {
      file: b.outputContract?.primary || 'index.html',
      singleHtml: b.outputContract?.singleHtml !== false,
    },
    prompts: {
      A: String(b.prompts?.A || ''),
      B: String(b.prompts?.B || ''),
      C: String(b.prompts?.C || ''),
    },
  }));
  const json = {
    schema: 'autonomy-bench-agent/v1',
    audience: 'coding-agent',
    site: SITE,
    suiteId: suite?.id || '',
    suiteVersion: suite?.version || '',
    levels: {
      A: suite?.promptLevels?.A?.name || 'Raw',
      B: suite?.promptLevels?.B?.name || 'Autonomous',
      C: suite?.promptLevels?.C?.name || 'Showcase',
    },
    output: { file: 'index.html', singleHtml: true, selfContained: true },
    rules: AGENT_RULES,
    benchmarks,
  };
  const benchBlocks = benchmarks
    .map((b) => {
      const lines = [`### ${b.title} (\`${b.id}\`)`, ''];
      for (const level of ['A', 'B', 'C']) {
        lines.push(`#### ${level} — ${json.levels[level]}`, '', b.prompts[level], '');
      }
      return lines.join('\n');
    })
    .join('\n');
  const llms = [
    '# Autonomy Bench',
    '',
    '> Frozen single-HTML browser-autonomy prompts for coding agents. Humans use the gallery UI.',
    '',
    `Suite: ${json.suiteId} ${json.suiteVersion}`,
    `Site: ${SITE}`,
    `Machine pack: ${SITE}/agent.json`,
    'WebMCP: the live gallery registers tools on document.modelContext (list-benches, get-bench-prompt, list-takes, show-take, get-gallery-state, get-receipt).',
    '',
    '## Rules',
    '',
    ...AGENT_RULES.map((rule) => `- ${rule}`),
    '',
    '## Live benches',
    '',
    benchBlocks.trimEnd(),
    '',
  ].join('\n');
  return { json, llms };
}
