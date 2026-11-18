import type { Id, Usuario, UsuarioAutenticado, Sala, SalaInput, Reserva, ConsultaReservas, ReservaListada } from '../domain/models.js';
export interface UsuarioRepository {
    criarUsuario(input: {
        nome: string;
        email: string;
        senha: string;
    }): Usuario;
    buscarPorId(id: Id): Usuario | undefined;
    buscarPorEmail(email: string): Usuario | undefined;
    atualizar(id: Id, input: {
        nome: string;
        email: string;
    }): void;
    excluir(id: Id): void;
}
export interface SalaRepository {
    criar(input: SalaInput): Sala;
    buscarPorId(id: Id): Sala | undefined;
    listarTodas(): Sala[];
    atualizar(id: Id, input: SalaInput): Sala;
    excluir(id: Id): void;
    possuiReservasFuturas(id: Id): boolean;
}
export interface ReservaRepository {
    criar(input: Omit<Reserva, 'id' | 'sala_id'> & {
        sala_id: Id;
    }): Reserva;
    buscarPorId(id: Id): Reserva | undefined;
    listarPorSalaEData(sala_id: Id, data: string): Reserva[];
    listar(input: ConsultaReservas): ReservaListada[];
    excluir(id: Id): boolean;
}
export interface PasswordHasher {
    hash(senha: string): Promise<string>;
    compare(senha: string, hash: string): Promise<boolean>;
}
export interface TokenService {
    sign(usuario: UsuarioAutenticado): string;
    verify(token: string): UsuarioAutenticado;
}
export interface Clock {
    now(): Date;
}
