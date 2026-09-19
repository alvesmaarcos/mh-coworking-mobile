import Router from "express";
import usuarioRoutes from "./usuarioRoutes.js";

const routes = Router();

routes.use(usuarioRoutes);

export default routes;
