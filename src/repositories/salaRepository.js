import db from "./database.js";

db.exec(`CREATE TABLE IF NOT EXISTS salas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    atributos TEXT,
    valor_hora REAL NOT NULL,
    imagem_url TEXT
)`);

function criar({ nome, descricao, atributos, valor_hora, imagem_url }) {
  const stmt = db.prepare(
    `INSERT INTO salas (nome, descricao, atributos, valor_hora, imagem_url) VALUES (?, ?, ?, ?, ?)`,
  );
  const resultado = stmt.run(nome, descricao, atributos, valor_hora, imagem_url);

  return buscarPorId(resultado.lastInsertRowid);
}

function buscarPorId(id) {
  return db.prepare(`SELECT * FROM salas WHERE id = ?`).get(id);
}

function listarTodas() {
  return db.prepare(`SELECT * FROM salas`).all();
}

export default { criar, buscarPorId, listarTodas };
