import express from "express";
import swaggerUi from "swagger-ui-express";
import routes from "../routes/index.js";

const app = express();
const swaggerOptions = { swaggerOptions: { url: "/swagger.yaml" } };

app.use(express.json());
app.use("/public", express.static("public"));
app.get("/swagger.yaml", (req, res) => res.sendFile("/swagger.yaml", { root: "." }));
app.use("/docs", swaggerUi.serveFiles(null, swaggerOptions), swaggerUi.setup(null, swaggerOptions));
app.use(routes);
app.use((erro, req, res, next) => {
  const status = erro.status || 500;
  const message = erro.message || "Erro interno do servidor";
  res.status(status).json({ erro: message });
});

export default app;
