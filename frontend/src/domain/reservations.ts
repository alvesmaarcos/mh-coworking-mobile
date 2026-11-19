import type { Filters, Reservation, ReservationTab } from './models';

export function startTime(reservation: Pick<Reservation, 'data' | 'hora'>): number {
  const [year, month, day] = reservation.data.split('-').map(Number);
  return new Date(year, month - 1, day, reservation.hora).getTime();
}

export function selectReservations(items: Reservation[], tab: ReservationTab, now: number, filters: Filters = {}): Reservation[] {
  return items.filter(item =>
    (filters.roomId === undefined || item.sala_id === filters.roomId) &&
    (!filters.date || item.data === filters.date) &&
    (tab === 'upcoming' ? startTime(item) > now : startTime(item) <= now)
  ).sort((a, b) => (tab === 'upcoming' ? 1 : -1) * (startTime(a) - startTime(b)) || a.id - b.id);
}

export function formatDate(value: string): string { return value.split('-').reverse().join('/'); }
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function formatPrice(value: number): string {
  return `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value)}`;
}
