import type { Database } from 'better-sqlite3';
export function initializeSalaSchema(db: Database) {
    db.exec(`CREATE TABLE IF NOT EXISTS salas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    atributos TEXT,
    valor_hora REAL NOT NULL,
    imagem_url TEXT
)`);
}
