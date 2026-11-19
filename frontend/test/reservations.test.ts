import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, formatDate, formatPrice, selectReservations, startTime } from '../src/domain/reservations';
import type { Reservation } from '../src/domain/models';
import { Cancellation } from '../src/application/cancellation';

const item = (id: number, date: string, hour: number, room = 1): Reservation => ({ id, data: date, hora: hour, sala_id: room, sala_nome: 'Sala', usuario_id: 2, usuario_nome: 'Cliente', valor: 20 });

test('classifica no início exato, ordena e não modifica a resposta original', () => {
  const records = [item(1, '2030-05-02', 10), item(2, '2030-05-01', 10), item(3, '2030-05-01', 9), item(4, '2030-05-01', 11)];
  const now = new Date(2030, 4, 1, 10).getTime();
  assert.deepEqual(selectReservations(records, 'upcoming', now).map(r => r.id), [4, 1]);
  assert.deepEqual(selectReservations(records, 'history', now).map(r => r.id), [2, 3]);
  assert.deepEqual(records.map(r => r.id), [1, 2, 3, 4]);
  assert.deepEqual(selectReservations(records, 'upcoming', now - 1).map(r => r.id), [2, 4, 1]);
});
test('combina sala, data e aba sem deslocamento UTC', () => {
  const records = [item(1, '2030-05-02', 8), item(2, '2030-05-02', 9, 2), item(3, '2030-05-03', 10)];
  assert.deepEqual(selectReservations(records, 'upcoming', 0, { roomId: 1, date: '2030-05-02' }).map(r => r.id), [1]);
  assert.equal(selectReservations(records, 'history', 0).length, 0);
  assert.equal(new Date(startTime(records[0])).getHours(), 8);
  assert.equal(dateKey(new Date(2030, 4, 2)), '2030-05-02');
  assert.equal(formatDate('2030-05-02'), '02/05/2030');
  assert.equal(formatPrice(20), 'R$ 20');
  assert.equal(formatPrice(20.5), 'R$ 20,50');
});
test('cancelamento bloqueia duplicatas e libera nova tentativa após erro', async () => {
  const cancellation = new Cancellation();
  let finish!: () => void;
  let calls = 0;
  const first = cancellation.run(async () => { calls++; await new Promise<void>(resolve => { finish = resolve; }); });
  assert.equal(await cancellation.run(async () => { calls++; }), false);
  finish();
  assert.equal(await first, true);
  assert.equal(calls, 1);
  await assert.rejects(cancellation.run(async () => { throw new Error('Falha'); }), /Falha/);
  assert.equal(await cancellation.run(async () => {}), true);
});
