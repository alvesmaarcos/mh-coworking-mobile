import reservaService from "../services/reservaService.js";

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
    const usuario = { id: req.usuarioId, tipo: req.usuarioTipo };
    const { sala_id, data, hora } = req.body;

    const reserva = await reservaService.criarReserva(usuario, { sala_id, data, hora });

    res.status(201).json(reserva);
  } catch (error) {
    next(error);
  }
}

export default { horarios, criar };
