const LEVELS = ['A', 'B', 'C'];
const MODES = ['single', 'models', 'ladder', 'table'];

export function mcpText(value) {
  const structured = value && typeof value === 'object' ? value : { text: String(value ?? '') };
  const text = typeof value === 'string' ? value : JSON.stringify(structured, null, 2);
  return { content: [{ type: 'text', text }], structuredContent: structured };
}

export function createModelContext() {
  const tools = new Map();
  const target = new EventTarget();
  function fire() {
    target.dispatchEvent(new Event('toolchange'));
  }
  function lookup(registered) {
    if (!registered) return null;
    if (typeof registered === 'string') return tools.get(registered) || null;
    if (registered.execute) return registered;
    return tools.get(registered.name) || null;
  }
  const context = {
    async registerTool(tool, options = {}) {
      const name = String((tool && tool.name) || '').trim();
      const description = String((tool && tool.description) || '').trim();
      if (!name || !description) throw new Error('Tool name and description are required');
      if (tools.has(name)) throw new Error(`Tool already registered: ${name}`);
      if (options.signal && options.signal.aborted) throw new Error('Registration aborted');
      tools.set(name, tool);
      if (options.signal) {
        options.signal.addEventListener(
          'abort',
          () => {
            tools.delete(name);
            fire();
          },
          { once: true },
        );
      }
      fire();
    },
    async getTools() {
      return [...tools.values()].map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        origin: '',
      }));
    },
    async executeTool(registered, inputObject = {}) {
      const tool = lookup(registered);
      if (!tool || typeof tool.execute !== 'function') throw new Error('Unknown tool');
      const result = await tool.execute(inputObject || {});
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    addEventListener: (...args) => target.addEventListener(...args),
    removeEventListener: (...args) => target.removeEventListener(...args),
    dispatchEvent: (event) => target.dispatchEvent(event),
    set ontoolchange(handler) {
      target.ontoolchange = handler;
    },
    get ontoolchange() {
      return target.ontoolchange || null;
    },
  };
  return context;
}

/** @param {{ document?: { modelContext?: object } }} [global] */
export function installModelContext(global = globalThis) {
  const doc = global.document;
  if (!doc) return null;
  if (doc.modelContext) return doc.modelContext;
  const context = createModelContext();
  Object.defineProperty(doc, 'modelContext', {
    configurable: true,
    enumerable: true,
    value: context,
  });
  return context;
}

function benchFromPack(pack, id) {
  return (pack?.benchmarks || []).find((row) => row.id === id) || null;
}

function promptFromPack(pack, benchmark, level) {
  const bench = benchFromPack(pack, benchmark);
  if (!bench) return '';
  return String(bench.prompts?.[String(level || '').toUpperCase()] || '');
}

export function buildGalleryTools(host) {
  return [
    {
      name: 'list-benches',
      description:
        'List live Autonomy Bench experiments and their frozen A/B/C prompt levels. Use this before writing a take.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute(_input = {}) {
        const pack = host.getPack();
        return mcpText({
          suiteId: pack?.suiteId || '',
          suiteVersion: pack?.suiteVersion || '',
          rules: pack?.rules || [],
          output: pack?.output || { file: 'index.html', singleHtml: true },
          levels: pack?.levels || { A: 'Raw', B: 'Autonomous', C: 'Showcase' },
          benches: (pack?.benchmarks || []).map((b) => ({
            id: b.id,
            title: b.title,
            category: b.category || '',
            levels: LEVELS.filter((level) => b.prompts && b.prompts[level]),
          })),
        });
      },
    },
    {
      name: 'get-bench-prompt',
      description:
        'Return the exact frozen prompt for one live bench and level. Do not expand or rewrite this text.',
      inputSchema: {
        type: 'object',
        properties: {
          benchmark: { type: 'string', description: 'Live bench id, for example rollercoaster.' },
          level: { type: 'string', enum: LEVELS, description: 'Prompt level A, B, or C.' },
        },
        required: ['benchmark', 'level'],
        additionalProperties: false,
      },
      async execute(input = {}) {
        const { benchmark, level } = input;
        const pack = host.getPack();
        const lvl = String(level || '').toUpperCase();
        const id = String(benchmark || '').trim();
        const prompt = promptFromPack(pack, id, lvl);
        if (!prompt) throw new Error(`Unknown bench or level: ${id} ${lvl}`);
        return mcpText({
          benchmark: id,
          level: lvl,
          prompt,
          output: pack?.output || { file: 'index.html', singleHtml: true },
          rules: pack?.rules || [],
        });
      },
    },
    {
      name: 'list-takes',
      description: 'List published gallery takes. Filter by experiment, level, or model.',
      inputSchema: {
        type: 'object',
        properties: {
          experiment: { type: 'string', description: 'Optional bench id.' },
          level: { type: 'string', enum: LEVELS, description: 'Optional prompt level.' },
          model: { type: 'string', description: 'Optional model id.' },
        },
        additionalProperties: false,
      },
      async execute(input = {}) {
        const { experiment, level, model } = input;
        const cells = host.getCatalog()?.cells || [];
        const lvl = level ? String(level).toUpperCase() : '';
        const rows = cells
          .filter((cell) => {
            if (experiment && cell.experiment !== experiment) return false;
            if (lvl && cell.level !== lvl) return false;
            if (model && cell.model !== model && cell.modelKey !== model) return false;
            return Boolean(cell.src);
          })
          .map((cell) => ({
            experiment: cell.experiment,
            level: cell.level,
            model: cell.model,
            date: cell.date,
            src: cell.src,
            receiptSrc: cell.receiptSrc || '',
          }));
        return mcpText({ count: rows.length, takes: rows });
      },
    },
    {
      name: 'show-take',
      description:
        'Show one published take in the gallery UI. Sets experiment, level, model, and optional view mode.',
      inputSchema: {
        type: 'object',
        properties: {
          experiment: { type: 'string', description: 'Bench id.' },
          level: { type: 'string', enum: LEVELS, description: 'Prompt level A, B, or C.' },
          model: { type: 'string', description: 'Published model id.' },
          mode: {
            type: 'string',
            enum: MODES,
            description: 'Gallery view. Defaults to single.',
          },
        },
        required: ['experiment', 'level', 'model'],
        additionalProperties: false,
      },
      async execute(input = {}) {
        const { experiment, level, model, mode } = input;
        const next = host.showTake({
          experiment: String(experiment || '').trim(),
          level: String(level || 'A').toUpperCase(),
          model: String(model || '').trim(),
          mode: MODES.includes(mode) ? mode : 'single',
        });
        return mcpText(next || { ok: true, experiment, level, model });
      },
    },
    {
      name: 'get-gallery-state',
      description: 'Return the current gallery filters, view, and selected take.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute(_input = {}) {
        return mcpText(host.getState());
      },
    },
    {
      name: 'get-receipt',
      description: 'Load the factual receipt for the current take, or a specified published take.',
      inputSchema: {
        type: 'object',
        properties: {
          experiment: { type: 'string' },
          level: { type: 'string', enum: LEVELS },
          model: { type: 'string' },
        },
        additionalProperties: false,
      },
      async execute(input = {}) {
        const receipt = await host.loadReceipt(input);
        if (!receipt) throw new Error('No receipt for that take');
        return mcpText(receipt);
      },
    },
  ];
}

/** @param {object} host @param {{ document?: { modelContext?: object } }} [global] */
export async function registerGalleryWebMcp(host, global = globalThis) {
  const context = installModelContext(global);
  if (!context || typeof context.registerTool !== 'function') return [];
  const tools = buildGalleryTools(host);
  for (const tool of tools) {
    await context.registerTool(tool);
  }
  return tools.map((tool) => tool.name);
}
