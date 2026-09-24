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

export default { criar, listar };
