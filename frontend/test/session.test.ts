import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegistrationLoginError, SessionStore, parseSession, type SessionStorage } from '../src/application/session';
import type { Session } from '../src/domain/models';

const adminSession: Session = { usuario: { id: 1, nome: 'Administrador', email: 'admin@example.com', tipo: 'ADM' }, token: 'admin-token' };
const clientSession: Session = { usuario: { id: 2, nome: 'Cliente', email: 'cliente@example.com', tipo: 'CLIENTE' }, token: 'client-token' };
function storage(initial: string | null = null): SessionStorage {
  let value = initial;
  return { read: async () => value, write: async next => { value = next; }, clear: async () => { value = null; } };
}
test('login real persiste sessão ADM; restauração e saída', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  await auth.restore();
  assert.equal(auth.getSnapshot().session, null);
  await auth.login({ login: async (email, password) => { assert.equal(email, 'admin@example.com'); assert.equal(password, 'password'); return adminSession; } }, ' admin@example.com ', 'password');
  assert.deepEqual(auth.getSnapshot().session, adminSession);
  const reopened = new SessionStore(memory);
  await reopened.restore();
  assert.deepEqual(reopened.getSnapshot().session, adminSession);
  await reopened.logout();
  assert.equal(await memory.read(), null);
  assert.equal(reopened.getSnapshot().session, null);
});
test('aceita sessão CLIENTE, rejeita credenciais inválidas e limpa sessão corrompida', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  await auth.restore();
  await auth.login({ login: async () => clientSession }, 'cliente@example.com', '123456');
  assert.deepEqual(auth.getSnapshot().session, clientSession);
  const reopened = new SessionStore(memory);
  await reopened.restore();
  assert.deepEqual(reopened.getSnapshot().session, clientSession);
  await assert.rejects(auth.login({ login: async () => { throw new Error('Email ou senha inválidos'); } }, 'client', 'wrong'), /inválidos/);
  assert.equal(parseSession('{broken'), null);
  assert.equal(parseSession(JSON.stringify({ token: 'x', usuario: { id: 1, nome: 'X', email: 'x@x', tipo: 'OUTRO' } })), null);
  assert.equal(parseSession(JSON.stringify({ token: 'x', usuario: { tipo: 'ADM' } })), null);
  const corrupt = storage('{broken');
  await new SessionStore(corrupt).restore();
  assert.equal(await corrupt.read(), null);
});
test('cadastro cria conta e realiza login automático como CLIENTE', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  const order: string[] = [];
  await auth.register(
    {
      register: async (name, email, password) => {
        order.push(`register:${name}:${email}:${password}`);
        return clientSession.usuario;
      },
      login: async (email, password) => {
        order.push(`login:${email}:${password}`);
        return clientSession;
      },
    },
    ' Cliente ',
    ' cliente@example.com ',
    '123456',
  );
  assert.deepEqual(order, ['register:Cliente:cliente@example.com:123456', 'login:cliente@example.com:123456']);
  assert.deepEqual(auth.getSnapshot().session, clientSession);
  assert.equal(await memory.read(), JSON.stringify(clientSession));
});
test('cadastro bem-sucedido com falha no login automático sinaliza RegistrationLoginError', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  await assert.rejects(
    auth.register(
      {
        register: async () => clientSession.usuario,
        login: async () => { throw new Error('Falha de rede'); },
      },
      'Cliente',
      'cliente@example.com',
      '123456',
    ),
    error => error instanceof RegistrationLoginError,
  );
  assert.equal(auth.getSnapshot().session, null);
  assert.equal(await memory.read(), null);
});
test('401 de sessão antiga não encerra login novo; sessão atual expira', async () => {
  const memory = storage(JSON.stringify(adminSession));
  const auth = new SessionStore(memory);
  await auth.restore();
  auth.expire('old-token');
  assert.equal(auth.getSnapshot().session?.token, adminSession.token);
  auth.expire(adminSession.token);
  assert.equal(auth.getSnapshot().session, null);
  assert.match(auth.getSnapshot().notice, /expirou/);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(await memory.read(), null);
});
test('resposta de login atrasada não reabre sessão após sair', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  let finish!: (value: Session) => void;
  const login = auth.login({ login: () => new Promise(resolve => { finish = resolve; }) }, 'admin', 'password');
  await auth.logout();
  finish(adminSession);
  await login;
  assert.equal(auth.getSnapshot().session, null);
  assert.equal(await memory.read(), null);
});
test('updateUser atualiza sessão em memória e no armazenamento sem alterar token', async () => {
  const memory = storage(JSON.stringify(clientSession));
  const auth = new SessionStore(memory);
  await auth.restore();
  await auth.updateUser({ id: 2, nome: 'Anna Beatryz', email: 'anna@example.com', tipo: 'CLIENTE' });
  assert.deepEqual(auth.getSnapshot().session, {
    token: 'client-token',
    usuario: { id: 2, nome: 'Anna Beatryz', email: 'anna@example.com', tipo: 'CLIENTE' },
  });
  assert.equal(await memory.read(), JSON.stringify(auth.getSnapshot().session));
});
