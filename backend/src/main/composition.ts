import { resolve } from 'node:path';
import { backendRoot } from './paths.js';
import { openDatabase } from '../infrastructure/database/database.js';
import { createUsuarioRepository } from '../infrastructure/database/usuarioRepository.js';
import { createSalaRepository } from '../infrastructure/database/salaRepository.js';
import { createReservaRepository } from '../infrastructure/database/reservaRepository.js';
import { passwords, createTokens } from '../infrastructure/security.js';
import { createUsuarioUseCases } from '../application/use-cases/usuarioUseCases.js';
import { createSalaUseCases } from '../application/use-cases/salaUseCases.js';
import { createReservaUseCases } from '../application/use-cases/reservaUseCases.js';
import { createUsuarioController } from '../adapters/http/controllers/usuarioController.js';
import { createSalaController } from '../adapters/http/controllers/salaController.js';
import { createReservaController } from '../adapters/http/controllers/reservaController.js';
import { createAuthMiddleware } from '../adapters/http/auth.js';
import { createRoutes } from '../adapters/http/routes.js';
import { createApp } from '../adapters/http/app.js';
import type { Clock } from '../application/ports.js';
export function createBackend(config: {
    databasePath: string;
    jwtSecret: string;
    clock?: Clock;
}) {
    const tokens = createTokens(config.jwtSecret);
    const db = openDatabase(config.databasePath);
    const usuarios = createUsuarioRepository(db);
    const salas = createSalaRepository(db);
    const reservas = createReservaRepository(db);
    const routes = createRoutes(createUsuarioController(createUsuarioUseCases(usuarios, passwords, tokens)), createSalaController(createSalaUseCases(salas)), createReservaController(createReservaUseCases(reservas, salas, config.clock ?? { now: () => new Date() })), createAuthMiddleware(tokens));
    const app = createApp(routes, { publicDirectory: resolve(backendRoot, 'public'), swaggerFile: resolve(backendRoot, 'swagger.yaml') });
    return { app, db, close: () => db.close() };
}
