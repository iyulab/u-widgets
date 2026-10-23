// Tests the MCP server (mcp/) against the core as it is now — packed from this tree, not the published copy.
//
// The MCP server depends on @iyulab/u-widgets by range, so its own install brings the registry version: a core
// change the server depends on (the catalog, validate's messages, the format grammar) would only meet the server's
// tests after it was published. This packs the built core (run after `npm run build`), installs the tarball into
// mcp/ without saving it, and runs the server's typecheck and tests. `npm run check` ends with it.
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mcp = join(root, 'mcp');
const run = (command, cwd) => execSync(command, { cwd, stdio: 'inherit' });

const out = mkdtempSync(join(tmpdir(), 'u-widgets-pack-'));
try {
  const name = execSync(`npm pack --ignore-scripts --silent --pack-destination "${out}"`, { cwd: root, encoding: 'utf8' })
    .trim()
    .split('\n')
    .pop();
  console.log(`mcp: testing against the packed core ${name}`);
  run(`npm install --no-save --no-package-lock --no-audit --no-fund "${join(out, name)}"`, mcp);
  run('npx tsc --noEmit -p .', mcp);
  run('npx vitest run', mcp);
} finally {
  rmSync(out, { recursive: true, force: true });
}
