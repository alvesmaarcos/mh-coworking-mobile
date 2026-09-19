import usuarioRepository from "../repositories/usuarioRepository.js";
import AppError from "../app/AppError.js";

function cadastrarUsuario(nome, email, senha) {
  if (!nome || !email || !senha) {
    throw new AppError("Nome, email e senha são obrigatórios", 400);
  }

  if (!email.includes("@")) {
    throw new AppError("Email inválido", 400);
  }

  if (senha.length < 6) {
    throw new AppError("A senha deve conter pelo menos seis caracteres", 400);
  }

  //console.log("service", nome, email, senha)
  const user = usuarioRepository.buscarPorEmail(email);
  if (user) {
    throw new AppError("Já existe um usuário cadastrado com este email", 409);
  }

  return usuarioRepository.criarUsuario({ nome, email, senha });
}

function login(email, senha) {
  if (!email || !senha) {
    throw new AppError("Email e senha são obrigatórios", 400);
  }

  const usuario = usuarioRepository.buscarPorEmail(email);

  if (!usuario || usuario.senha !== senha) {
    throw new AppError("Email ou senha inválidos");
  }

  return usuario;
}

export default { cadastrarUsuario, login };
