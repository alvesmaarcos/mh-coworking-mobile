import type { Database } from 'better-sqlite3';
export function initializeUsuarioSchema(db: Database) {
    db.exec(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CLIENTE', 'ADM'))
)`);
}
