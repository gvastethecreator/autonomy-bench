/** @param {string[]} argv */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--') continue;
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else args[key] = true;
  }
  return args;
}

/** @param {string[]} argv */
export function parseCommandArgs(argv) {
  const args = parseArgs(argv);
  const command = args._.shift() || 'help';
  return { command, args };
}
