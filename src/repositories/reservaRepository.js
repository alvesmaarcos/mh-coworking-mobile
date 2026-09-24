import db from "./database.js";

db.exec(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    sala_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    hora INTEGER NOT NULL,
    valor REAL NOT NULL,
    UNIQUE(sala_id, data, hora)
)`);

function criar({ usuario_id, sala_id, data, hora, valor }) {
  const stmt = db.prepare(
    `INSERT INTO reservas (usuario_id, sala_id, data, hora, valor) VALUES (?, ?, ?, ?, ?)`,
  );
  const resultado = stmt.run(usuario_id, sala_id, data, hora, valor);

  return buscarPorId(resultado.lastInsertRowid);
}

function buscarPorId(id) {
  return db.prepare(`SELECT * FROM reservas WHERE id = ?`).get(id);
}

function listarPorSalaEData(sala_id, data) {
  return db.prepare(`SELECT * FROM reservas WHERE sala_id = ? AND data = ?`).all(sala_id, data);
}

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

function excluir(id) {
  return db.prepare("DELETE FROM reservas WHERE id = ?").run(id).changes > 0;
}

export default { criar, buscarPorId, listarPorSalaEData, listar, excluir };
