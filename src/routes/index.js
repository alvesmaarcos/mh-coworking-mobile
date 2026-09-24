import Router from "express";
import usuarioRoutes from "./usuarioRoutes.js";
import reservaRoutes from "./reservaRoutes.js";

const routes = Router();

routes.use(usuarioRoutes);
routes.use(reservaRoutes);

export default routes;
