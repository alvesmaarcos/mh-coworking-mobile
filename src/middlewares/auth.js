import jwt from "jsonwebtoken";
import AppError from "../app/AppError.js";

const SECRET = "minha_chave_secreta_jwt_123"; // Deve ser a mesma chave usada no usuarioService.js

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError("Token não fornecido", 401));
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(new AppError("Token mal formatado", 401));
  }

  const token = parts[1];

  jwt.verify(token, SECRET, (erro, decoded) => {
    if (erro) {
      return next(new AppError("Token inválido ou expirado", 401));
    }

    // Injeta o ID e Tipo do usuário logado na requisição para que outras rotas usem
    req.usuarioId = decoded.id;
    req.usuarioTipo = decoded.tipo;
    
    return next();
  });
}
