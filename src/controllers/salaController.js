import salaService from "../services/salaService.js";
import AppError from "../app/AppError.js";

async function criar(req, res, next) {
  try {
    if (req.usuarioTipo !== "ADM") {
      throw new AppError("Apenas administradores podem cadastrar salas", 403);
    }

    const { nome, descricao, atributos, valor_hora, imagem_url } = req.body;

    const sala = await salaService.criarSala({ nome, descricao, atributos, valor_hora, imagem_url });

    res.status(201).json(sala);
  } catch (error) {
    next(error);
  }
}

async function listar(req, res, next) {
  try {
    const salas = await salaService.listarSalas();
    res.status(200).json(salas);
  } catch (error) {
    next(error);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const sala = await salaService.buscarSala(req.params.id);
    res.status(200).json(sala);
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    if (req.usuarioTipo !== "ADM") {
      throw new AppError("Apenas administradores podem editar salas", 403);
    }

    const { nome, descricao, atributos, valor_hora, imagem_url } = req.body;

    const sala = await salaService.atualizarSala(req.params.id, { nome, descricao, atributos, valor_hora, imagem_url });

    res.status(200).json(sala);
  } catch (error) {
    next(error);
  }
}

async function excluir(req, res, next) {
  try {
    if (req.usuarioTipo !== "ADM") {
      throw new AppError("Apenas administradores podem excluir salas", 403);
    }

    await salaService.excluirSala(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default { criar, listar, buscarPorId, atualizar, excluir };
