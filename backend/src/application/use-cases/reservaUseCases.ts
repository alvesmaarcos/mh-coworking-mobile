import { HORARIOS_COWORKING, validarFormatoData, reservaEhFutura } from '../../domain/reservaRules.js';
import DomainError from '../../domain/DomainError.js';
import type { Id, ReservaInput, UsuarioAutenticado, ConsultaReservas } from '../../domain/models.js';
import type { ReservaRepository, SalaRepository, Clock } from '../ports.js';
export function createReservaUseCases(reservaRepository: ReservaRepository, salaRepository: SalaRepository, clock: Clock) {
    function horariosDisponiveis(sala_id: Id, data: unknown) {
        const sala = salaRepository.buscarPorId(sala_id);
        if (!sala) {
            throw new DomainError("Sala não encontrada", "not_found");
        }
        if (!validarFormatoData(data)) {
            throw new DomainError("Data inválida. Use o formato AAAA-MM-DD", "validation");
        }
        const reservas = reservaRepository.listarPorSalaEData(sala_id, data);
        const horasReservadas = new Set(reservas.map((reserva) => reserva.hora));
        return HORARIOS_COWORKING.map((hora) => ({
            hora,
            reservado: horasReservadas.has(hora),
        }));
    }
    function criarReserva(usuario: UsuarioAutenticado, { sala_id, data, hora }: ReservaInput) {
        if (usuario.tipo !== "CLIENTE") {
            throw new DomainError("Apenas clientes podem realizar reservas", "forbidden");
        }
        const sala = salaRepository.buscarPorId(sala_id);
        if (!sala) {
            throw new DomainError("Sala não encontrada", "not_found");
        }
        if (!validarFormatoData(data)) {
            throw new DomainError("Data inválida. Use o formato AAAA-MM-DD", "validation");
        }
        const horaNumero = Number(hora);
        if (!HORARIOS_COWORKING.includes(horaNumero)) {
            throw new DomainError("Horário inválido. Deve ser um dos horários do coworking (8 a 17)", "validation");
        }
        const reservasExistentes = reservaRepository.listarPorSalaEData(sala_id, data);
        const conflito = reservasExistentes.some((reserva) => reserva.hora === horaNumero);
        if (conflito) {
            throw new DomainError("Já existe uma reserva para esta sala, data e horário", "conflict");
        }
        return reservaRepository.criar({
            usuario_id: usuario.id,
            sala_id,
            data,
            hora: horaNumero,
            valor: sala.valor_hora,
        });
    }
    function validarId(valor: unknown, nome = "ID") {
        const id = Number(valor);
        if (!Number.isInteger(id) || id <= 0) {
            throw new DomainError(`${nome} inválido`, "validation");
        }
        return id;
    }
    function normalizarUsuario(usuario: UsuarioAutenticado): UsuarioAutenticado {
        if (!usuario?.id || !["CLIENTE", "ADM"].includes(usuario.tipo)) {
            throw new DomainError("Usuário autenticado inválido", "unauthorized");
        }
        return { id: Number(usuario.id), tipo: usuario.tipo };
    }
    function listarReservas(usuario: UsuarioAutenticado, filtros: {
        sala_id?: unknown;
        data?: unknown;
    } = {}) {
        const autenticado = normalizarUsuario(usuario);
        const consulta: ConsultaReservas = { usuarioId: autenticado.id, tipo: autenticado.tipo };
        if (autenticado.tipo === "ADM" && filtros.sala_id !== undefined) {
            consulta.salaId = validarId(filtros.sala_id, "ID da sala");
        }
        if (autenticado.tipo === "ADM" && filtros.data !== undefined) {
            if (!validarFormatoData(filtros.data)) {
                throw new DomainError("Data inválida. Use o formato AAAA-MM-DD", "validation");
            }
            consulta.data = filtros.data;
        }
        return reservaRepository.listar(consulta);
    }
    function cancelarReserva(idInformado: Id, usuario: UsuarioAutenticado, agora = clock.now()) {
        const id = validarId(idInformado, "ID da reserva");
        const autenticado = normalizarUsuario(usuario);
        const reserva = reservaRepository.buscarPorId(id);
        if (!reserva) {
            throw new DomainError("Reserva não encontrada", "not_found");
        }
        const ehDono = Number(reserva.usuario_id) === autenticado.id;
        if (autenticado.tipo !== "ADM" && !ehDono) {
            throw new DomainError("Você não tem permissão para cancelar esta reserva", "forbidden");
        }
        if (!reservaEhFutura(reserva, agora)) {
            throw new DomainError("Somente reservas futuras podem ser canceladas", "validation");
        }
        reservaRepository.excluir(id);
    }
    return {
        HORARIOS_COWORKING,
        horariosDisponiveis,
        criarReserva,
        listarReservas,
        cancelarReserva,
    };
}
