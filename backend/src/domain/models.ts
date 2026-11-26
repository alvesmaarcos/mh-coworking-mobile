export type Perfil = 'CLIENTE' | 'ADM';
export type Id = number | string | bigint;
export interface Usuario {
    id: number;
    nome: string;
    email: string;
    senha?: string;
    tipo: Perfil;
}
export interface UsuarioAutenticado {
    id: number;
    tipo: Perfil;
}
export interface Sala {
    id: number;
    nome: string;
    descricao: string | null;
    atributos: string | null;
    valor_hora: number;
    imagem_url: string | null;
}
export interface Reserva {
    id: number;
    usuario_id: number;
    sala_id: number;
    data: string;
    hora: number;
    valor: number;
}
export interface ReservaListada extends Reserva {
    sala_nome: string;
    usuario_nome: string;
    usuario_email?: string;
}
export interface SalaInput {
    nome: string;
    descricao?: string | null;
    atributos?: string | null;
    valor_hora: number | string;
    imagem_url?: string | null;
}
export interface ReservaInput {
    sala_id: Id;
    data: string;
    hora: number | string;
}
export interface ConsultaReservas {
    usuarioId: number;
    tipo: Perfil;
    salaId?: number;
    data?: string;
}
