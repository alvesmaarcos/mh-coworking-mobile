import usuarioRepository from "../repositories/usuarioRepository.js";
import AppError from "../app/AppError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET = "minha_chave_secreta_jwt_123"; // O ideal em produção é usar process.env.SECRET

async function cadastrarUsuario(nome, email, senha) {
  if (!nome || !email || !senha) {
    throw new AppError("Nome, email e senha são obrigatórios", 400);
  }

  if (!email.includes("@")) {
    throw new AppError("Email inválido", 400);
  }

  if (senha.length < 6) {
    throw new AppError("A senha deve conter pelo menos seis caracteres", 400);
  }

  const user = usuarioRepository.buscarPorEmail(email);
  if (user) {
    throw new AppError("Já existe um usuário cadastrado com este email", 409);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  return usuarioRepository.criarUsuario({ nome, email, senha: senhaHash });
}

async function login(email, senha) {
  if (!email || !senha) {
    throw new AppError("Email e senha são obrigatórios", 400);
  }

  const usuario = usuarioRepository.buscarPorEmail(email);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    throw new AppError("Email ou senha inválidos", 401);
  }

  // Gera o token JWT com duração de 1 dia
  const token = jwt.sign(
    { id: usuario.id, tipo: usuario.tipo },
    SECRET,
    { expiresIn: "1d" }
  );

  return { usuario, token };
}

export default { cadastrarUsuario, login };
