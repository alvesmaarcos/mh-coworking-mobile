export interface User { id: number; nome: string; email: string; tipo: 'ADM' | 'CLIENTE' }
export interface UpdateUserInput { nome: string; email: string; senha?: string }
export interface Session { usuario: User; token: string }
export interface Room {
  id: number;
  nome: string;
  descricao?: string | null;
  atributos?: string | null;
  valor_hora?: number;
  imagem_url?: string | null;
}
export type RoomInput = Omit<Room, 'id'> & { valor_hora: number };
export interface Reservation {
  id: number;
  usuario_id: number;
  sala_id: number;
  data: string;
  hora: number;
  valor: number;
  sala_nome: string;
  usuario_nome: string;
  usuario_email?: string;
}
export interface AvailableHour { hora: number; reservado: boolean; expirado: boolean }
export interface ReservationInput { sala_id: number; data: string; hora: number }
export type CreatedReservation = Omit<Reservation, 'sala_nome' | 'usuario_nome' | 'usuario_email'>;
export type ReservationTab = 'upcoming' | 'history';
export interface Filters { roomId?: number; date?: string }
