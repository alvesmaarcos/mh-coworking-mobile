import reservaRepository from "../repositories/reservaRepository.js";
import salaRepository from "../repositories/salaRepository.js";
import AppError from "../app/AppError.js";

const HORARIOS_COWORKING = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function validarFormatoData(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataConvertida = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataConvertida.getUTCFullYear() === ano &&
    dataConvertida.getUTCMonth() === mes - 1 &&
    dataConvertida.getUTCDate() === dia
  );
}

function horariosDisponiveis(sala_id, data) {
  const sala = salaRepository.buscarPorId(sala_id);
  if (!sala) {
    throw new AppError("Sala não encontrada", 404);
  }

  if (!validarFormatoData(data)) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD", 400);
  }

  const reservas = reservaRepository.listarPorSalaEData(sala_id, data);
  const horasReservadas = new Set(reservas.map((reserva) => reserva.hora));

  return HORARIOS_COWORKING.map((hora) => ({
    hora,
    reservado: horasReservadas.has(hora),
  }));
}

function criarReserva(usuario, { sala_id, data, hora }) {
  if (usuario.tipo !== "CLIENTE") {
    throw new AppError("Apenas clientes podem realizar reservas", 403);
  }

  const sala = salaRepository.buscarPorId(sala_id);
  if (!sala) {
    throw new AppError("Sala não encontrada", 404);
  }

  if (!validarFormatoData(data)) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD", 400);
  }

  const horaNumero = Number(hora);
  if (!HORARIOS_COWORKING.includes(horaNumero)) {
    throw new AppError("Horário inválido. Deve ser um dos horários do coworking (8 a 17)", 400);
  }

  const reservasExistentes = reservaRepository.listarPorSalaEData(sala_id, data);
  const conflito = reservasExistentes.some((reserva) => reserva.hora === horaNumero);
  if (conflito) {
    throw new AppError("Já existe uma reserva para esta sala, data e horário", 409);
  }

  return reservaRepository.criar({
    usuario_id: usuario.id,
    sala_id,
    data,
    hora: horaNumero,
    valor: sala.valor_hora,
  });
}

function validarId(valor, nome = "ID") {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${nome} inválido`, 400);
  }
  return id;
}

function normalizarUsuario(usuario) {
  if (!usuario?.id || !["CLIENTE", "ADM"].includes(usuario.tipo)) {
    throw new AppError("Usuário autenticado inválido", 401);
  }
  return { id: Number(usuario.id), tipo: usuario.tipo };
}

function listarReservas(usuario, filtros = {}) {
  const autenticado = normalizarUsuario(usuario);
  const consulta = { usuarioId: autenticado.id, tipo: autenticado.tipo };

  if (autenticado.tipo === "ADM" && filtros.sala_id !== undefined) {
    consulta.salaId = validarId(filtros.sala_id, "ID da sala");
  }

  if (autenticado.tipo === "ADM" && filtros.data !== undefined) {
    if (!validarFormatoData(filtros.data)) {
      throw new AppError("Data inválida. Use o formato AAAA-MM-DD", 400);
    }
    consulta.data = filtros.data;
  }

  return reservaRepository.listar(consulta);
}

function reservaEhFutura(reserva, agora = new Date()) {
  const [ano, mes, dia] = reserva.data.split("-").map(Number);
  const instante = new Date(ano, mes - 1, dia, Number(reserva.hora), 0, 0, 0);
  return instante.getTime() > agora.getTime();
}

function cancelarReserva(idInformado, usuario, agora = new Date()) {
  const id = validarId(idInformado, "ID da reserva");
  const autenticado = normalizarUsuario(usuario);
  const reserva = reservaRepository.buscarPorId(id);

  if (!reserva) {
    throw new AppError("Reserva não encontrada", 404);
  }

  const ehDono = Number(reserva.usuario_id) === autenticado.id;
  if (autenticado.tipo !== "ADM" && !ehDono) {
    throw new AppError("Você não tem permissão para cancelar esta reserva", 403);
  }

  if (!reservaEhFutura(reserva, agora)) {
    throw new AppError("Somente reservas futuras podem ser canceladas", 400);
  }

  reservaRepository.excluir(id);
}

export default {
  HORARIOS_COWORKING,
  horariosDisponiveis,
  criarReserva,
  listarReservas,
  cancelarReserva,
};
