import db from "./database.js";

function listar({ usuarioId, tipo, salaId, data }) {
  const filtros = [];
  const parametros = {};

  if (tipo === "CLIENTE") {
    filtros.push("r.usuario_id = @usuarioId");
    parametros.usuarioId = usuarioId;
  } else {
    if (salaId !== undefined) {
      filtros.push("r.sala_id = @salaId");
      parametros.salaId = salaId;
    }

    if (data !== undefined) {
      filtros.push("r.data = @data");
      parametros.data = data;
    }
  }

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

  return db.prepare(`
    SELECT
      r.id,
      r.usuario_id,
      r.sala_id,
      r.data,
      r.hora,
      r.valor,
      s.nome AS sala_nome,
      u.nome AS usuario_nome
    FROM reservas r
    JOIN salas s ON s.id = r.sala_id
    JOIN usuarios u ON u.id = r.usuario_id
    ${where}
    ORDER BY r.data ASC, r.hora ASC
  `).all(parametros);
}

function buscarPorId(id) {
  return db.prepare("SELECT * FROM reservas WHERE id = ?").get(id);
}

function excluir(id) {
  return db.prepare("DELETE FROM reservas WHERE id = ?").run(id).changes > 0;
}

export default { listar, buscarPorId, excluir };
