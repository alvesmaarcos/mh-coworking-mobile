import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterRooms } from '../src/domain/rooms';
import type { Room } from '../src/domain/models';

const rooms: Room[] = [
  { id: 1, nome: 'Sala de Reuniões', descricao: 'Espaço amplo', atributos: 'TV, climatizada' },
  { id: 2, nome: 'Sala Individual', descricao: 'Privativa', atributos: 'Ar-condicionado' },
];

test('busca salas por nome, descrição e características sem diferenciar acentos', () => {
  assert.deepEqual(filterRooms(rooms, 'reunioes').map(room => room.id), [1]);
  assert.deepEqual(filterRooms(rooms, 'PRIVATIVA').map(room => room.id), [2]);
  assert.deepEqual(filterRooms(rooms, '  climatizada  ').map(room => room.id), [1]);
  assert.deepEqual(filterRooms(rooms, 'inexistente'), []);
  assert.deepEqual(filterRooms(rooms, '  '), rooms);
});
