// backend/src/env.js
// Must be imported BEFORE any module that reads process.env at load time.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

try {
  process.loadEnvFile(path.resolve(root, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
