import usuarioService from "../services/usuarioService.js";
import AppError from "../app/AppError.js";

async function cadastrar(req, res, next) {
  try {
    const { nome, email, senha } = req.body;
    
    const usuario = await usuarioService.cadastrarUsuario(nome, email, senha);

    delete usuario.senha;

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    const { usuario, token } = await usuarioService.login(email, senha);

    delete usuario.senha;

    res.status(200).json({ usuario, token });
  } catch (error) {
    next(error);
  }
}

function verificarDono(req) {
  if (String(req.usuarioId) !== String(req.params.id)) {
    throw new AppError("Você não tem permissão para acessar este recurso", 403);
  }
}

async function buscarPorId(req, res, next) {
  try {
    verificarDono(req);
    const usuario = await usuarioService.buscarPorId(req.params.id);
    delete usuario.senha;
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    verificarDono(req);
    const usuario = await usuarioService.atualizar(req.params.id, req.body);
    delete usuario.senha;
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function excluir(req, res, next) {
  try {
    verificarDono(req);
    await usuarioService.excluir(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default { cadastrar, login, buscarPorId, atualizar, excluir };
