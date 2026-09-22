import reservaService from "../services/reservaService.js";

function listar(req, res, next) {
  try {
    const reservas = reservaService.listarReservas(req.usuario, req.query);
    res.status(200).json(reservas);
  } catch (error) {
    next(error);
  }
}

function cancelar(req, res, next) {
  try {
    reservaService.cancelarReserva(req.params.id, req.usuario);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default { listar, cancelar };
