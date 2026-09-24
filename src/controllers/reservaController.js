import reservaService from "../services/reservaService.js";

function obterUsuario(req) {
  return { id: req.usuarioId, tipo: req.usuarioTipo };
}

async function horarios(req, res, next) {
  try {
    const { id } = req.params;
    const { data } = req.query;

    const horarios = await reservaService.horariosDisponiveis(id, data);

    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
}

async function criar(req, res, next) {
  try {
    const { sala_id, data, hora } = req.body;

    const reserva = await reservaService.criarReserva(obterUsuario(req), { sala_id, data, hora });

    res.status(201).json(reserva);
  } catch (error) {
    next(error);
  }
}

function listar(req, res, next) {
  try {
    const reservas = reservaService.listarReservas(obterUsuario(req), req.query);
    res.status(200).json(reservas);
  } catch (error) {
    next(error);
  }
}

function cancelar(req, res, next) {
  try {
    reservaService.cancelarReserva(req.params.id, obterUsuario(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default { horarios, criar, listar, cancelar };
