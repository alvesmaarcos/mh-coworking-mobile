import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionStore, parseSession, type SessionStorage } from '../src/application/session';
import type { Session } from '../src/domain/models';

const session: Session = { usuario: { id: 1, nome: 'Administrador', email: 'admin@example.com', tipo: 'ADM' }, token: 'admin-token' };
function storage(initial: string | null = null): SessionStorage {
  let value = initial;
  return { read: async () => value, write: async next => { value = next; }, clear: async () => { value = null; } };
}
test('login real persiste sessão ADM; restauração e saída', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  await auth.restore();
  assert.equal(auth.getSnapshot().session, null);
  await auth.login({ login: async (email, password) => { assert.equal(email, 'admin@example.com'); assert.equal(password, 'password'); return session; } }, ' admin@example.com ', 'password');
  assert.deepEqual(auth.getSnapshot().session, session);
  const reopened = new SessionStore(memory);
  await reopened.restore();
  assert.deepEqual(reopened.getSnapshot().session, session);
  await reopened.logout();
  assert.equal(await memory.read(), null);
  assert.equal(reopened.getSnapshot().session, null);
});
test('bloqueia CLIENTE, credenciais inválidas e sessão corrompida', async () => {
  const memory = storage();
  const auth = new SessionStore(memory);
  await auth.restore();
  await assert.rejects(auth.login({ login: async () => ({ ...session, usuario: { ...session.usuario, tipo: 'CLIENTE' } }) }, 'client', 'password'), /administradores/);
  assert.equal(await memory.read(), null);
  await assert.rejects(auth.login({ login: async () => { throw new Error('Email ou senha inválidos'); } }, 'client', 'wrong'), /inválidos/);
  assert.equal(parseSession('{broken'), null);
  assert.equal(parseSession(JSON.stringify({ token: 'x', usuario: { tipo: 'ADM' } })), null);
  const corrupt = storage('{broken');
  await new SessionStore(corrupt).restore();
  assert.equal(await corrupt.read(), null);
});
test('401 de sessão antiga não encerra login novo; sessão atual expira', async () => {
  const memory = storage(JSON.stringify(session));
  const auth = new SessionStore(memory);
  await auth.restore();
  auth.expire('old-token');
  assert.equal(auth.getSnapshot().session?.token, session.token);
  auth.expire(session.token);
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
  finish(session);
  await login;
  assert.equal(auth.getSnapshot().session, null);
  assert.equal(await memory.read(), null);
});
