import type { Database } from 'better-sqlite3';
import type { UsuarioRepository } from '../../application/ports.js';
import type { Usuario } from '../../domain/models.js';
export function createUsuarioRepository(db: Database): UsuarioRepository {
    const repository: UsuarioRepository = {
        criarUsuario({ nome, email, senha }) {
            const tipo = "CLIENTE";
            const stmt = db.prepare(`INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`);
            const resultado = stmt.run(nome, email, senha, tipo);
            return repository.buscarPorId(resultado.lastInsertRowid)!;
        },
        buscarPorId(id) {
            return db.prepare<unknown[], Usuario>(`SELECT * FROM usuarios WHERE id = ?`).get(id);
        },
        buscarPorEmail(email) {
            return db.prepare<unknown[], Usuario>(`SELECT * FROM usuarios WHERE email = ? COLLATE NOCASE`).get(email);
        },
        atualizar(id, { nome, email }) {
            db.prepare('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?').run(nome, email, id);
        },
        atualizarSenha(id, senha) {
            db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(senha, id);
        },
        excluir(id) {
            db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
        }
    };
    return repository;
}
