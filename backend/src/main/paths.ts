import { fileURLToPath } from 'node:url';
// Same relative layout in src/main and dist/main; independent of process.cwd().
export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
export const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
