import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, ApiError } from '../src/infrastructure/api';

test('envia JWT e filtros da API; aceita cancelamento 204 sem JSON', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const api = new ApiClient('http://api.test/', undefined, async (input, init) => {
    calls.push({ url: String(input), init });
    return init?.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json([]);
  });
  await api.reservations('token', { roomId: 2, date: '2030-01-01' });
  assert.equal(calls[0].url, 'http://api.test/reservas?sala_id=2&data=2030-01-01');
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, 'Bearer token');
  await api.cancel('token', 3);
  assert.equal(calls[1].url, 'http://api.test/reservas/3');
  assert.equal(calls[1].init?.method, 'DELETE');
});
test('401 autenticado expira sessão; erro de login não dispara expiração', async () => {
  const expired: string[] = [];
  const api = new ApiClient('http://api.test', token => expired.push(token), async () => Response.json({ erro: 'Token inválido ou expirado' }, { status: 401 }));
  await assert.rejects(api.reservations('old'), error => error instanceof ApiError && error.status === 401);
  assert.deepEqual(expired, ['old']);
  await assert.rejects(api.login('email', 'password'));
  assert.deepEqual(expired, ['old']);
});
test('erros de API preservam mensagem e falha de rede permite nova tentativa', async () => {
  const api = new ApiClient('http://api.test', undefined, async () => Response.json({ erro: 'Somente reservas futuras podem ser canceladas' }, { status: 400 }));
  await assert.rejects(api.cancel('token', 1), /Somente reservas futuras/);
  const offline = new ApiClient('http://api.test', undefined, async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(offline.rooms(), /Verifique sua conexão/);
});
test('cadastro envia POST /usuarios com nome, email e senha e preserva erro de conflito', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const api = new ApiClient('http://api.test', undefined, async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json({ id: 9, nome: 'Ana', email: 'ana@example.com', tipo: 'CLIENTE' }, { status: 201 });
  });
  const created = await api.register('Ana', 'ana@example.com', '123456');
  assert.equal(created.tipo, 'CLIENTE');
  assert.equal(calls[0].url, 'http://api.test/usuarios');
  assert.equal(calls[0].init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { nome: 'Ana', email: 'ana@example.com', senha: '123456' });
  const conflict = new ApiClient('http://api.test', undefined, async () => Response.json({ erro: 'Já existe um usuário cadastrado com este email' }, { status: 409 }));
  await assert.rejects(conflict.register('Ana', 'ana@example.com', '123456'), error => error instanceof ApiError && error.status === 409 && /este email/.test(error.message));
test('resolve URLs das imagens no mesmo host da API e mantém URLs absolutas', () => {
  assert.equal(new ApiClient('/api').assetUrl('/public/sala.jpeg'), '/api/public/sala.jpeg');
  assert.equal(new ApiClient('https://api.test/api/').assetUrl('/public/sala.jpeg'), 'https://api.test/public/sala.jpeg');
  assert.equal(new ApiClient('https://api.test').assetUrl('https://cdn.test/sala.jpeg'), 'https://cdn.test/sala.jpeg');
});
test('busca os detalhes de uma sala pela rota real por id', async () => {
  const calls: { url: string }[] = [];
  const api = new ApiClient('http://api.test', undefined, async (input) => {
    calls.push({ url: String(input) });
    return Response.json({ id: 7, nome: 'Sala 7' });
  });
  const room = await api.room(7);
  assert.equal(room.id, 7);
  assert.equal(calls[0].url, 'http://api.test/salas/7');
});
