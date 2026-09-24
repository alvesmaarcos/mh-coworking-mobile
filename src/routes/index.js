import Router from "express";
import usuarioRoutes from "./usuarioRoutes.js";
import reservaRoutes from "./reservaRoutes.js";
import salaRoutes from "./salaRoutes.js";

const routes = Router();

routes.use(usuarioRoutes);
routes.use(reservaRoutes);
routes.use(salaRoutes);

export default routes;
