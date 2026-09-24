import Router from "express";
import usuarioRoutes from "./usuarioRoutes.js";
import salaRoutes from "./salaRoutes.js";

const routes = Router();

routes.use(usuarioRoutes);
routes.use(salaRoutes);

export default routes;
