export interface User { id: number; nome: string; email: string; tipo: 'ADM' | 'CLIENTE' }
export interface Session { usuario: User; token: string }
export interface Room {
  id: number;
  nome: string;
  descricao?: string | null;
  atributos?: string | null;
  valor_hora?: number;
  imagem_url?: string | null;
}
export interface Reservation {
  id: number;
  usuario_id: number;
  sala_id: number;
  data: string;
  hora: number;
  valor: number;
  sala_nome: string;
  usuario_nome: string;
}
export type ReservationTab = 'upcoming' | 'history';
export interface Filters { roomId?: number; date?: string }
