import DomainError from '../../domain/DomainError.js';
import type { Id, SalaInput, UsuarioAutenticado } from '../../domain/models.js';
import type { SalaRepository } from '../ports.js';
export function createSalaUseCases(salaRepository: SalaRepository) {
    function criarSala({ nome, descricao, atributos, valor_hora, imagem_url }: SalaInput, usuario: UsuarioAutenticado) {
        if (usuario.tipo !== "ADM")
            throw new DomainError("Apenas administradores podem cadastrar salas", "forbidden");
        if (!nome) {
            throw new DomainError("Nome é obrigatório", "validation");
        }
        if (valor_hora === undefined || valor_hora === null || isNaN(Number(valor_hora)) || Number(valor_hora) <= 0) {
            throw new DomainError("Valor por hora deve ser um número maior que zero", "validation");
        }
        return salaRepository.criar({
            nome,
            descricao,
            atributos,
            valor_hora: Number(valor_hora),
            imagem_url,
        });
    }
    function listarSalas() {
        return salaRepository.listarTodas();
    }
    function buscarSala(id: Id) {
        const sala = salaRepository.buscarPorId(id);
        if (!sala) {
            throw new DomainError("Sala não encontrada", "not_found");
        }
        return sala;
    }
    function atualizarSala(id: Id, { nome, descricao, atributos, valor_hora, imagem_url }: SalaInput, usuario: UsuarioAutenticado) {
        if (usuario.tipo !== "ADM")
            throw new DomainError("Apenas administradores podem editar salas", "forbidden");
        buscarSala(id);
        if (!nome) {
            throw new DomainError("Nome é obrigatório", "validation");
        }
        if (valor_hora === undefined || valor_hora === null || isNaN(Number(valor_hora)) || Number(valor_hora) <= 0) {
            throw new DomainError("Valor por hora deve ser um número maior que zero", "validation");
        }
        return salaRepository.atualizar(id, {
            nome,
            descricao,
            atributos,
            valor_hora: Number(valor_hora),
            imagem_url,
        });
    }
    function excluirSala(id: Id, usuario: UsuarioAutenticado) {
        if (usuario.tipo !== "ADM")
            throw new DomainError("Apenas administradores podem excluir salas", "forbidden");
        buscarSala(id);
        if (salaRepository.possuiReservasFuturas(id)) {
            throw new DomainError("Não é possível excluir a sala, pois ela possui reservas futuras", "conflict");
        }
        salaRepository.excluir(id);
    }
    return { criarSala, listarSalas, buscarSala, atualizarSala, excluirSala };
}
