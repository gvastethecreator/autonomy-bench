import { describe, expect, it } from 'vite-plus/test';
import { parseArgs, parseCommandArgs } from '../scripts/cli-args.mjs';

describe('parseArgs', () => {
  it('skips leftover -- from vp run', () => {
    expect(parseArgs(['--', '--run', 'abc'])).toEqual({ _: [], run: 'abc' });
  });

  it('treats a flag without a value as true', () => {
    expect(parseArgs(['--viewer'])).toEqual({ _: [], viewer: true });
  });

  it('reads key value pairs', () => {
    expect(parseArgs(['--run', 'abc', 'extra'])).toEqual({ _: ['extra'], run: 'abc' });
  });
});

describe('parseCommandArgs', () => {
  it('takes the first positional as the command', () => {
    expect(parseCommandArgs(['--', 'list'])).toEqual({ command: 'list', args: { _: [] } });
    expect(parseCommandArgs(['plan', '--models', 'grok-4.6'])).toEqual({
      command: 'plan',
      args: { _: [], models: 'grok-4.6' },
    });
  });
});
