import type { Room } from './models';

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterRooms(rooms: Room[], query: string) {
  const search = normalize(query.trim());
  if (!search) return rooms;
  return rooms.filter(room => [room.nome, room.descricao ?? '', room.atributos ?? '']
    .some(value => normalize(value).includes(search)));
}
