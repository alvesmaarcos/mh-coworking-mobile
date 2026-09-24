import Router from "express";
import salaController from "../controllers/salaController.js";
import authMiddleware from "../middlewares/auth.js";

const rotas = Router();

rotas.post("/salas", authMiddleware, salaController.criar);
rotas.get("/salas", salaController.listar);

export default rotas;
