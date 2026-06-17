// Copies the Monaco Editor runtime from node_modules into public/ so it can be
// served from the same origin instead of a third-party CDN. Running locally
// keeps user data private (no request to jsdelivr/unpkg), works offline, and
// removes a supply-chain risk. Wired into `postinstall` and `prebuild`.
import { existsSync, rmSync, cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'monaco-editor', 'min', 'vs');
const dest = join(root, 'public', 'monaco', 'vs');

if (!existsSync(src)) {
  console.warn('[copy-monaco] monaco-editor not found at', src, '— skipping copy');
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('[copy-monaco] Copied Monaco runtime → public/monaco/vs');
