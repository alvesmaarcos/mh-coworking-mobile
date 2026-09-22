import Router from "express";
import reservaController from "../controllers/reservaController.js";
import auth from "../middlewares/auth.js";

const rotas = Router();

rotas.get("/reservas", auth, reservaController.listar);
rotas.delete("/reservas/:id", auth, reservaController.cancelar);

export default rotas;
