import Router from "express";
import usuarioController from "../controllers/usuarioController.js";

const rotas = Router();

rotas.post("/usuarios", usuarioController.cadastrar);
rotas.post("/login", usuarioController.login);

export default rotas;
