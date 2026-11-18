import type { Database } from 'better-sqlite3';
export function initializeReservaSchema(db: Database) {
    db.exec(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    sala_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    hora INTEGER NOT NULL,
    valor REAL NOT NULL,
    UNIQUE(sala_id, data, hora)
)`);
}
