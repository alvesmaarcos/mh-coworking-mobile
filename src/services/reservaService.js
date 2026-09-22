import AppError from "../app/AppError.js";
import reservaRepository from "../repositories/reservaRepository.js";

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function validarId(valor, nome = "ID") {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${nome} inválido`, 400);
  }
  return id;
}

function dataValida(data) {
  if (!FORMATO_DATA.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const criada = new Date(Date.UTC(ano, mes - 1, dia));
  return criada.getUTCFullYear() === ano
    && criada.getUTCMonth() === mes - 1
    && criada.getUTCDate() === dia;
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
    if (!dataValida(filtros.data)) {
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

export default { listarReservas, cancelarReserva };
