import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { initializeUsuarioSchema } from './usuarioSchema.js';
import { initializeSalaSchema } from './salaSchema.js';
import { initializeReservaSchema } from './reservaSchema.js';
export function openDatabase(path: string) {
    const db = new Database(path);
    try {
        initializeUsuarioSchema(db);
        initializeSalaSchema(db);
        initializeReservaSchema(db);
        // Preserve the existing initial administrator; never replace its password.
        if (!db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@montehorebe.com')) {
            db.prepare('INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)')
                .run('Administrador', 'admin@montehorebe.com', bcrypt.hashSync('admin123', 10), 'ADM');
        }
        return db;
    }
    catch (error) {
        db.close();
        throw error;
    }
}
