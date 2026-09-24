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

export default { criar, buscarPorId, listarPorSalaEData };
