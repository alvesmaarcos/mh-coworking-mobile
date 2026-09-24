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

function buscarSala(id) {
  const sala = salaRepository.buscarPorId(id);

  if (!sala) {
    throw new AppError("Sala não encontrada", 404);
  }

  return sala;
}

function atualizarSala(id, { nome, descricao, atributos, valor_hora, imagem_url }) {
  buscarSala(id);

  if (!nome) {
    throw new AppError("Nome é obrigatório", 400);
  }

  if (valor_hora === undefined || valor_hora === null || isNaN(Number(valor_hora)) || Number(valor_hora) <= 0) {
    throw new AppError("Valor por hora deve ser um número maior que zero", 400);
  }

  return salaRepository.atualizar(id, {
    nome,
    descricao,
    atributos,
    valor_hora: Number(valor_hora),
    imagem_url,
  });
}

function excluirSala(id) {
  buscarSala(id);

  if (salaRepository.possuiReservasFuturas(id)) {
    throw new AppError("Não é possível excluir a sala, pois ela possui reservas futuras", 409);
  }

  salaRepository.excluir(id);
}

export default { criarSala, listarSalas, buscarSala, atualizarSala, excluirSala };
