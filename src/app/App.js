import express from "express";
import routes from "../routes/index.js";

const app = express();

app.use(express.json());
app.use("/public", express.static("public"));
app.use(routes);
app.use((erro, req, res, next) => {
  const status = erro.status || 500;
  const message = erro.message || "Erro interno do servidor";
  res.status(status).json({ erro: message });
});

export default app;
