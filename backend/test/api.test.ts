import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import type { Server } from 'node:http';
import { createBackend } from '../src/main/composition.js';
import { backendRoot } from '../src/main/paths.js';
const directory = mkdtempSync(join(tmpdir(), 'mh-clean-'));
const databasePath = join(directory, 'test.db');
const config = { databasePath, jwtSecret: 'test-only-secret', clock: { now: () => new Date(2030, 0, 1) } };
let backend: ReturnType<typeof createBackend>;
let server: Server;
let base: string;
let admin: string;
let client: string;
let secondClient: string;
let userId: number;
let salaId: number;
let reservaId: number;
async function request(path: string, method = 'GET', body?: unknown, token?: string) {
    const response = await fetch(base + path, {
        method,
        headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
}
before(async () => {
    backend = createBackend(config);
    server = backend.app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
});
after(async () => {
    if (server)
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    backend?.close();
    rmSync(directory, { recursive: true, force: true });
});
test('cadastro e login mantêm contrato, bcrypt e perfis', async () => {
    assert.equal((await request('/usuarios', 'POST', { nome: 'Teste', email: 'invalid', senha: '123456' })).status, 400);
    const created = await request('/usuarios', 'POST', { nome: 'Cliente', email: 'cliente@example.com', senha: '123456' });
    assert.equal(created.status, 201);
    assert.equal(created.body.tipo, 'CLIENTE');
    assert.equal(created.body.senha, undefined);
    userId = created.body.id;
    const stored = backend.db.prepare('SELECT senha FROM usuarios WHERE id = ?').get(userId) as {
        senha: string;
    };
    assert.match(stored.senha, /^\$2/);
    assert.equal((await request('/usuarios', 'POST', { nome: 'Outro', email: 'cliente@example.com', senha: '123456' })).status, 409);
    assert.equal((await request('/login', 'POST', { email: 'cliente@example.com', senha: 'errada' })).status, 401);
    const login = await request('/login', 'POST', { email: 'cliente@example.com', senha: '123456' });
    assert.equal(login.status, 200);
    assert.equal(login.body.usuario.senha, undefined);
    client = login.body.token;
    admin = (await request('/login', 'POST', { email: 'admin@montehorebe.com', senha: 'admin123' })).body.token;
    await request('/usuarios', 'POST', { nome: 'Segundo', email: 'segundo@example.com', senha: '123456' });
    secondClient = (await request('/login', 'POST', { email: 'segundo@example.com', senha: '123456' })).body.token;
});
test('autenticação e propriedade de usuários preservam respostas', async () => {
    assert.deepEqual(await request('/reservas'), { status: 401, body: { erro: 'Token não fornecido' } });
    assert.deepEqual(await request('/reservas', 'GET', undefined, 'invalid'), { status: 401, body: { erro: 'Token inválido ou expirado' } });
    const malformed = await fetch(base + '/reservas', { headers: { Authorization: 'Basic abc' } });
    assert.equal(malformed.status, 401);
    assert.equal((await malformed.json()).erro, 'Token mal formatado');
    assert.equal((await request(`/usuarios/${userId}`, 'GET', undefined, secondClient)).status, 403);
    assert.equal((await request(`/usuarios/${userId}`, 'GET', undefined, admin)).status, 403);
    assert.equal((await request(`/usuarios/${userId}`, 'GET', undefined, client)).body.senha, undefined);
    const updated = await request(`/usuarios/${userId}`, 'PUT', { nome: 'Atualizado', email: 'cliente@example.com' }, client);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.nome, 'Atualizado');
});
test('salas públicas e alterações restritas ao administrador', async () => {
    const input = { nome: 'Sala teste', descricao: 'Descrição', atributos: 'Wi-Fi', valor_hora: '30', imagem_url: '/public/copa-1.jpeg' };
    assert.equal((await request('/salas', 'POST', input, client)).status, 403);
    assert.equal((await request('/salas', 'POST', { ...input, valor_hora: 0 }, admin)).status, 400);
    const created = await request('/salas', 'POST', input, admin);
    assert.equal(created.status, 201);
    salaId = created.body.id;
    assert.equal(created.body.valor_hora, 30);
    assert.equal((await request('/salas')).body.length, 1);
    assert.equal((await request(`/salas/${salaId}`)).body.id, salaId);
    assert.equal((await request('/salas/999999')).status, 404);
    assert.equal((await request(`/salas/${salaId}`, 'PUT', input, client)).status, 403);
    assert.equal((await request(`/salas/${salaId}`, 'PUT', { ...input, valor_hora: 40 }, admin)).body.valor_hora, 40);
});
test('disponibilidade, validações, conflito e filtros de reservas', async () => {
    const input = { sala_id: salaId, data: '2099-12-20', hora: 10 };
    assert.equal((await request(`/salas/${salaId}/horarios?data=2099-02-30`)).status, 400);
    assert.equal((await request(`/salas/${salaId}/horarios?data=${input.data}`)).body.length, 10);
    assert.equal((await request('/reservas', 'POST', input, admin)).status, 403);
    assert.equal((await request('/reservas', 'POST', { ...input, hora: 18 }, client)).status, 400);
    const created = await request('/reservas', 'POST', input, client);
    assert.equal(created.status, 201);
    reservaId = created.body.id;
    assert.equal(created.body.valor, 40);
    assert.equal(created.body.usuario_id, userId);
    assert.equal((await request('/reservas', 'POST', input, secondClient)).status, 409);
    const slots = (await request(`/salas/${salaId}/horarios?data=${input.data}`)).body;
    assert.equal(slots.find((slot: {
        hora: number;
    }) => slot.hora === 10).reservado, true);
    assert.equal((await request('/reservas', 'GET', undefined, secondClient)).body.length, 0);
    const listed = (await request('/reservas', 'GET', undefined, client)).body;
    assert.equal(listed[0].sala_nome, 'Sala teste');
    assert.equal(listed[0].usuario_nome, 'Atualizado');
    assert.equal((await request(`/reservas?sala_id=${salaId}&data=${input.data}`, 'GET', undefined, admin)).body.length, 1);
    assert.equal((await request('/reservas?data=2099-12-21', 'GET', undefined, admin)).body.length, 0);
    assert.equal((await request('/reservas?sala_id=abc', 'GET', undefined, admin)).status, 400);
    assert.equal((await request(`/salas/${salaId}`, 'DELETE', undefined, admin)).status, 409);
});
test('cancelamento exige dono ou administrador e reserva futura', async () => {
    assert.equal((await request(`/reservas/${reservaId}`, 'DELETE', undefined, secondClient)).status, 403);
    assert.equal((await request(`/reservas/${reservaId}`, 'DELETE', undefined, client)).status, 204);
    assert.equal((await request(`/reservas/${reservaId}`, 'DELETE', undefined, client)).status, 404);
    const future = await request('/reservas', 'POST', { sala_id: salaId, data: '2099-12-21', hora: 10 }, client);
    assert.equal((await request(`/reservas/${future.body.id}`, 'DELETE', undefined, admin)).status, 204);
    // Creating past reservations was already permitted; this migration preserves that rule.
    const past = await request('/reservas', 'POST', { sala_id: salaId, data: '2000-01-01', hora: 10 }, client);
    assert.equal(past.status, 201);
    assert.equal((await request(`/reservas/${past.body.id}`, 'DELETE', undefined, client)).status, 400);
    assert.equal((await request(`/salas/${salaId}`, 'DELETE', undefined, client)).status, 403);
    assert.equal((await request(`/salas/${salaId}`, 'DELETE', undefined, admin)).status, 204);
});
test('Swagger, seus assets e fotos continuam acessíveis pelos mesmos caminhos', async () => {
    const docs = await fetch(base + '/docs');
    assert.equal(docs.status, 200);
    assert.match(await docs.text(), /swagger-ui/);
    for (const file of ['swagger-ui.css', 'swagger-ui-bundle.js', 'swagger-ui-standalone-preset.js', 'swagger-ui-init.js']) {
        const asset = await fetch(`${base}/docs/${file}`);
        assert.equal(asset.status, 200, file);
        const content = await asset.text();
        if (file === 'swagger-ui-init.js')
            assert.match(content, /\/swagger\.yaml/);
    }
    const spec = await fetch(base + '/swagger.yaml');
    assert.equal(spec.status, 200);
    assert.equal(await spec.text(), readFileSync(resolve(backendRoot, 'swagger.yaml'), 'utf8'));
    const photo = await fetch(base + '/public/copa-1.jpeg');
    assert.equal(photo.status, 200);
    assert.match(photo.headers.get('content-type')!, /image\/jpeg/);
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), readFileSync(resolve(backendRoot, 'public/copa-1.jpeg')));
});
test('reabrir SQLite preserva registros e credenciais existentes', () => {
    const before = backend.db.prepare('SELECT * FROM usuarios ORDER BY id').all();
    const reservations = backend.db.prepare('SELECT * FROM reservas ORDER BY id').all();
    const reopened = createBackend(config);
    try {
        assert.deepEqual(reopened.db.prepare('SELECT * FROM usuarios ORDER BY id').all(), before);
        assert.deepEqual(reopened.db.prepare('SELECT * FROM reservas ORDER BY id').all(), reservations);
    }
    finally {
        reopened.close();
    }
});
test('exclusão do próprio usuário mantém status 204', async () => {
    assert.equal((await request(`/usuarios/${userId}`, 'DELETE', undefined, secondClient)).status, 403);
    assert.equal((await request(`/usuarios/${userId}`, 'DELETE', undefined, client)).status, 204);
    assert.equal((await request(`/usuarios/${userId}`, 'GET', undefined, client)).status, 404);
});
test('chave JWT ausente impede inicialização antes de abrir o banco', () => {
    assert.throws(() => createBackend({ databasePath: ':memory:', jwtSecret: '' }), /JWT_SECRET/);
});
