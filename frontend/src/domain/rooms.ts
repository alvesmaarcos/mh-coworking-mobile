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

//back ainda não recebe upload; a "foto de capa" é escolhida entre as imagens já servidas em /public.
export const ROOM_PHOTOS = [
  ...[1, 2, 3, 4, 5, 6].map(n => `/public/sala-individual-${n}.jpeg`),
  ...[1, 2, 3, 4].map(n => `/public/sala-reunioes-${n}.jpeg`),
  '/public/sala-grande-1.jpeg', '/public/area-aberta-1.jpeg', '/public/entrada-1.jpeg',
  ...[1, 2, 3, 4].map(n => `/public/recepcao-${n}.jpeg`),
  ...[1, 2, 3].map(n => `/public/copa-${n}.jpeg`),
];

/** Aceita "35", "35,5" e "35.50"; devolve null se não for um valor positivo. */
export function parsePrice(value: string) {
  const price = Number(value.trim().replace(',', '.'));
  return value.trim() && Number.isFinite(price) && price > 0 ? price : null;
}
