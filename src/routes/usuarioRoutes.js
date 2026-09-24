import Router from "express";
import usuarioController from "../controllers/usuarioController.js";
import authMiddleware from "../middlewares/auth.js";

const rotas = Router();

rotas.post("/usuarios", usuarioController.cadastrar);
rotas.post("/login", usuarioController.login);

rotas.get("/usuarios/:id", authMiddleware, usuarioController.buscarPorId);
rotas.put("/usuarios/:id", authMiddleware, usuarioController.atualizar);
rotas.delete("/usuarios/:id", authMiddleware, usuarioController.excluir);

export default rotas;
