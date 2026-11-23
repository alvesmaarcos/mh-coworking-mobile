import { once } from 'node:events';
import bcrypt from 'bcrypt';
import { createBackend } from '../../backend/dist/main/composition.js';
import { createPreview } from './preview.mjs';

// This process never opens database.db. All fixtures live in memory.
const backend = createBackend({ databasePath: ':memory:', jwtSecret: 'isolated-e2e-secret', clock: { now: () => new Date(2030, 0, 1, 12) } });
backend.db.prepare('INSERT INTO usuarios (id, nome, email, senha, tipo) VALUES (?, ?, ?, ?, ?)')
  .run(2, 'Cliente teste', 'cliente@example.com', bcrypt.hashSync('123456', 10), 'CLIENTE');
backend.db.exec(`INSERT INTO salas (id, nome, descricao, atributos, valor_hora, imagem_url) VALUES
  (1, 'Sala Individual', 'Espaço individual climatizado.', 'Climatizada, Privativa', 20, '/public/sala-individual-3.jpeg'),
  (2, 'Sala Grande', 'Espaço para reuniões.', 'TV ampla, Espaçosa', 50, '/public/sala-grande-1.jpeg')`);
function reset() {
  backend.db.exec('DELETE FROM reservas');
  const insert = backend.db.prepare('INSERT INTO reservas (id, usuario_id, sala_id, data, hora, valor) VALUES (?, 2, ?, ?, ?, ?)');
  insert.run(1, 1, '2030-01-03', 10, 20);
  insert.run(2, 1, '2030-01-04', 10, 20);
  insert.run(3, 1, '2030-01-05', 10, 20);
  insert.run(4, 1, '2029-12-15', 10, 20);
  insert.run(5, 2, '2029-12-08', 10, 50);
}
reset();
backend.app.post('/__test/reset', (_req, res) => { reset(); res.sendStatus(204); });
const api = backend.app.listen(4199, '127.0.0.1');
await once(api, 'listening');
const preview = createPreview('http://127.0.0.1:4199').listen(4180, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  preview.close();
  api.close(() => { backend.close(); process.exit(0); });
});
