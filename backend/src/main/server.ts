import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBackend } from './composition.js';
import { createEmailSender } from '../infrastructure/email.js';
import { repositoryRoot } from './paths.js';
const envFile = resolve(repositoryRoot, '.env');
if (existsSync(envFile))
    process.loadEnvFile(envFile);
const backend = createBackend({
    databasePath: resolve(repositoryRoot, process.env.DATABASE_PATH || 'database.db'),
    jwtSecret: process.env.JWT_SECRET || '',
    email: createEmailSender(process.env),
});
const port = Number(process.env.PORT || 3000);
const server = backend.app.listen(port, () => console.log('Servidor executando na PORTA', port));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => server.close(() => backend.close()));
}
