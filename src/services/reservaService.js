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

export default { HORARIOS_COWORKING, horariosDisponiveis, criarReserva };
