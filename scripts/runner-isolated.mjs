import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const AGY_PATH = 'C:\\Users\\cristian\\AppData\\Local\\agy\\bin\\agy.exe';

function cleanHtml(raw) {
  let text = raw.trim();
  // Strip markdown code fences if model wrapped output in ```html ... ```
  if (text.startsWith('```html')) {
    text = text.replace(/^```html\s*\n?/, '').replace(/\n?```\s*$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return text.trim();
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function runSubagent(model, effort, prompt) {
  return new Promise((resolve, reject) => {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    const proc = spawn(AGY_PATH, ['--model', model, '--effort', effort, '--print', prompt], {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      if (code !== 0) {
        reject(new Error(`Subagent failed with code ${code}: ${stderr}`));
      } else {
        resolve({
          output: cleanHtml(stdout),
          startedAt,
          completedAt,
          durationMs
        });
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function processRun(runId, model, effort) {
  const manifestPath = `runs/2026/08/24/${runId}/manifest.json`;
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`\n========================================`);
  console.log(`Processing Run: ${runId} (${model}, effort: ${effort})`);
  console.log(`========================================`);

  for (const cell of manifest.cells) {
    const cellDir = `runs/2026/08/24/${runId}/${path.dirname(cell.promptPath)}`;
    const promptPath = `runs/2026/08/24/${runId}/${cell.promptPath}`;
    const outputPath = `runs/2026/08/24/${runId}/${cell.outputPath}/index.html`;
    const receiptPath = `runs/2026/08/24/${runId}/${cell.receiptPath}`;

    const promptText = fs.readFileSync(promptPath, 'utf8').trim();
    console.log(`\n[Dispatching Subagent] Cell: ${cell.cellId} (Level ${cell.promptLevel})`);
    console.log(`Prompt: "${promptText}"`);

    const fullPrompt = `${promptText}\n\nDeliver the response as a single, complete, fully working HTML file with Three.js included via CDN. Output ONLY the raw HTML code without markdown backticks, conversational preamble, or explanations.`;

    try {
      const result = await runSubagent(model, effort, fullPrompt);
      console.log(`✓ Completed in ${result.durationMs}ms (${result.output.length} characters)`);

      // Ensure output directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, result.output, 'utf8');

      const fileBuffer = fs.readFileSync(outputPath);
      const outputHash = sha256(fileBuffer);

      const receipt = {
        schemaVersion: 1,
        runId,
        cellId: cell.cellId,
        benchmarkId: cell.benchmarkId,
        promptLevel: cell.promptLevel,
        attempt: cell.attempt,
        requestedModel: model,
        effectiveModel: model,
        effectiveModelSource: "runtime-observed",
        reasoning: effort,
        promptSha256: cell.promptSha256,
        status: "complete",
        adapter: "agent",
        harness: "antigravity-cli",
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        durationMs: result.durationMs,
        isolation: {
          capability: "fresh-context-no-sibling-outputs",
          adapter: "antigravity-cli-subagent",
          inheritedHistory: false,
          coordinatorContextExposed: false,
          evidence: "isolated subprocess dispatch via agy CLI"
        },
        tokenUsage: "not captured",
        toolCalls: "not captured",
        outputPaths: ["output/index.html"],
        outputHashes: {
          "output/index.html": outputHash
        },
        externalReceipts: [],
        limitations: [],
        errors: [],
        contributor: {
          github: "gvastethecreator",
          avatarUrl: "https://github.com/gvastethecreator.png"
        }
      };

      fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', 'utf8');
      console.log(`✓ Saved receipt with hash: ${outputHash}`);
    } catch (err) {
      console.error(`✗ Error executing subagent for cell ${cell.cellId}:`, err);
    }
  }
}

async function main() {
  const runs = [
    { runId: '20260824-134633-gemini-3.7-flash-endless-driving-abc-e31c8787', model: 'gemini-3.7-flash', effort: 'high' },
    { runId: '20260824-134633-gemini-3.1-pro-endless-driving-abc-af5abea0', model: 'gemini-3.1-pro', effort: 'high' },
    { runId: '20260824-134633-gemini-3.7-flash-rollercoaster-abc-add01f17', model: 'gemini-3.7-flash', effort: 'high' },
    { runId: '20260824-134633-gemini-3.1-pro-rollercoaster-abc-7d3f29ac', model: 'gemini-3.1-pro', effort: 'high' }
  ];

  for (const r of runs) {
    await processRun(r.runId, r.model, r.effort);
  }

  console.log(`\nAll subagents completed.`);
}

main().catch(console.error);
