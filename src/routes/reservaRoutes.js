import Router from "express";
import reservaController from "../controllers/reservaController.js";
import authMiddleware from "../middlewares/auth.js";

const rotas = Router();

rotas.get("/salas/:id/horarios", reservaController.horarios);
rotas.post("/reservas", authMiddleware, reservaController.criar);

export default rotas;
