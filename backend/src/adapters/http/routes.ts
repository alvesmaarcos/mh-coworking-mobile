import { Router, type RequestHandler } from 'express';
import type { createUsuarioController } from './controllers/usuarioController.js';
import type { createSalaController } from './controllers/salaController.js';
import type { createReservaController } from './controllers/reservaController.js';
export function createRoutes(usuarioController: ReturnType<typeof createUsuarioController>, salaController: ReturnType<typeof createSalaController>, reservaController: ReturnType<typeof createReservaController>, authMiddleware: RequestHandler) {
    const routes = Router();
    routes.post("/usuarios", usuarioController.cadastrar);
    routes.post("/login", usuarioController.login);
    routes.get("/usuarios/:id", authMiddleware, usuarioController.buscarPorId);
    routes.put("/usuarios/:id", authMiddleware, usuarioController.atualizar);
    routes.delete("/usuarios/:id", authMiddleware, usuarioController.excluir);
    routes.get("/salas/:id/horarios", reservaController.horarios);
    routes.post("/reservas", authMiddleware, reservaController.criar);
    routes.get("/reservas", authMiddleware, reservaController.listar);
    routes.delete("/reservas/:id", authMiddleware, reservaController.cancelar);
    routes.post("/salas", authMiddleware, salaController.criar);
    routes.get("/salas", salaController.listar);
    routes.get("/salas/:id", salaController.buscarPorId);
    routes.put("/salas/:id", authMiddleware, salaController.atualizar);
    routes.delete("/salas/:id", authMiddleware, salaController.excluir);
    return routes;
}
