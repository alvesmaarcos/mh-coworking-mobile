import type { Database } from 'better-sqlite3';
import type { SalaRepository } from '../../application/ports.js';
import type { Sala } from '../../domain/models.js';
export function createSalaRepository(db: Database): SalaRepository {
    const repository: SalaRepository = {
        criar({ nome, descricao, atributos, valor_hora, imagem_url }) {
            const stmt = db.prepare(`INSERT INTO salas (nome, descricao, atributos, valor_hora, imagem_url) VALUES (?, ?, ?, ?, ?)`);
            const resultado = stmt.run(nome, descricao, atributos, valor_hora, imagem_url);
            return repository.buscarPorId(resultado.lastInsertRowid)!;
        },
        buscarPorId(id) {
            return db.prepare<unknown[], Sala>(`SELECT * FROM salas WHERE id = ?`).get(id);
        },
        listarTodas() {
            return db.prepare<unknown[], Sala>(`SELECT * FROM salas`).all();
        },
        atualizar(id, { nome, descricao, atributos, valor_hora, imagem_url }) {
            db.prepare(`UPDATE salas SET nome = ?, descricao = ?, atributos = ?, valor_hora = ?, imagem_url = ? WHERE id = ?`).run(nome, descricao, atributos, valor_hora, imagem_url, id);
            return repository.buscarPorId(id)!;
        },
        excluir(id) {
            db.prepare(`DELETE FROM salas WHERE id = ?`).run(id);
        },
        possuiReservasFuturas(id) {
            return !!db
                .prepare(`SELECT 1 FROM reservas WHERE sala_id = ? AND data >= date('now', 'localtime') LIMIT 1`)
                .get(id);
        }
    };
    return repository;
}
