import type { Database } from 'better-sqlite3';
import type { ReservaRepository } from '../../application/ports.js';
import type { Reserva, ReservaListada } from '../../domain/models.js';
export function createReservaRepository(db: Database): ReservaRepository {
    const repository: ReservaRepository = {
        criar({ usuario_id, sala_id, data, hora, valor }) {
            const stmt = db.prepare(`INSERT INTO reservas (usuario_id, sala_id, data, hora, valor) VALUES (?, ?, ?, ?, ?)`);
            const resultado = stmt.run(usuario_id, sala_id, data, hora, valor);
            return repository.buscarPorId(resultado.lastInsertRowid)!;
        },
        buscarPorId(id) {
            return db.prepare<unknown[], Reserva>(`SELECT * FROM reservas WHERE id = ?`).get(id);
        },
        listarPorSalaEData(sala_id, data) {
            return db.prepare<unknown[], Reserva>(`SELECT * FROM reservas WHERE sala_id = ? AND data = ?`).all(sala_id, data);
        },
        listar({ usuarioId, tipo, salaId, data }) {
            const filtros = [];
            const parametros: Record<string, number | string> = {};
            if (tipo === "CLIENTE") {
                filtros.push("r.usuario_id = @usuarioId");
                parametros.usuarioId = usuarioId;
            }
            else {
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
            return db.prepare<Record<string, number | string>, ReservaListada>(`
    SELECT
      r.id,
      r.usuario_id,
      r.sala_id,
      r.data,
      r.hora,
      r.valor,
      s.nome AS sala_nome,
      u.nome AS usuario_nome${tipo === "ADM" ? ", u.email AS usuario_email" : ""}
    FROM reservas r
    JOIN salas s ON s.id = r.sala_id
    JOIN usuarios u ON u.id = r.usuario_id
    ${where}
    ORDER BY r.data ASC, r.hora ASC
  `).all(parametros);
        },
        excluir(id) {
            return db.prepare("DELETE FROM reservas WHERE id = ?").run(id).changes > 0;
        }
    };
    return repository;
}
