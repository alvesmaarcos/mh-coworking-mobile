import salaRepository from "../repositories/salaRepository.js";
import AppError from "../app/AppError.js";

function criarSala({ nome, descricao, atributos, valor_hora, imagem_url }) {
  if (!nome) {
    throw new AppError("Nome é obrigatório", 400);
  }

  if (valor_hora === undefined || valor_hora === null || isNaN(Number(valor_hora)) || Number(valor_hora) <= 0) {
    throw new AppError("Valor por hora deve ser um número maior que zero", 400);
  }

  return salaRepository.criar({
    nome,
    descricao,
    atributos,
    valor_hora: Number(valor_hora),
    imagem_url,
  });
}

function listarSalas() {
  return salaRepository.listarTodas();
}

export default { criarSala, listarSalas };
