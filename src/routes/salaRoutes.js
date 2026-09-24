import Router from "express";
import salaController from "../controllers/salaController.js";
import authMiddleware from "../middlewares/auth.js";

const rotas = Router();

rotas.post("/salas", authMiddleware, salaController.criar);
rotas.get("/salas", salaController.listar);
rotas.get("/salas/:id", salaController.buscarPorId);
rotas.put("/salas/:id", authMiddleware, salaController.atualizar);
rotas.delete("/salas/:id", authMiddleware, salaController.excluir);

export default rotas;
