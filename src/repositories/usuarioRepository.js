import db from "./database.js";
import bcrypt from "bcrypt";

db.exec(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CLIENTE', 'ADM'))
)`);

const hashAdmin = bcrypt.hashSync('admin123', 10);

db.exec(`INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES
    ('Administrador', 'admin@montehorebe.com', '${hashAdmin}', 'ADM')`);

function criarUsuario({ nome, email, senha }) {
  const tipo = "CLIENTE";
  const stmt = db.prepare(
    `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`,
  );
  const resultado = stmt.run(nome, email, senha, tipo);

  return buscarPorId(resultado.lastInsertRowid);
}

function buscarPorId(id) {
  return db.prepare(`SELECT * FROM usuarios WHERE id = ?`).get(id);
}

function buscarPorEmail(email) {
  return db.prepare(`SELECT * FROM usuarios WHERE email = ?`).get(email);
}

export default { criarUsuario, buscarPorId, buscarPorEmail };
