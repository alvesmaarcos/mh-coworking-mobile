import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSalaUseCases } from '../src/application/use-cases/salaUseCases.js';
import { createReservaUseCases } from '../src/application/use-cases/reservaUseCases.js';
import type { SalaRepository, ReservaRepository } from '../src/application/ports.js';
import DomainError from '../src/domain/DomainError.js';
test('permissões protegem os casos de uso mesmo sem Express', () => {
    let writes = 0;
    const salas: SalaRepository = {
        criar: input => { writes++; return { id: 1, nome: input.nome, descricao: null, atributos: null, imagem_url: null, valor_hora: Number(input.valor_hora) }; },
        buscarPorId: () => undefined,
        listarTodas: () => [],
        atualizar: () => { throw new Error('Não deveria ser chamado'); },
        excluir: () => { writes++; },
        possuiReservasFuturas: () => false,
    };
    const cases = createSalaUseCases(salas);
    const cliente = { id: 2, tipo: 'CLIENTE' as const };
    for (const action of [
        () => cases.criarSala({ nome: 'Sala', valor_hora: 20 }, cliente),
        () => cases.atualizarSala(1, { nome: 'Sala', valor_hora: 20 }, cliente),
        () => cases.excluirSala(1, cliente),
    ])
        assert.throws(action, error => error instanceof DomainError && error.kind === 'forbidden');
    assert.equal(writes, 0);
    assert.equal(cases.criarSala({ nome: 'Sala', valor_hora: 20 }, { id: 1, tipo: 'ADM' }).id, 1);
    assert.equal(writes, 1);
});
test('relógio injetado controla o limite de cancelamento sem banco real', () => {
    let deleted = false;
    const reserva = { id: 1, usuario_id: 2, sala_id: 3, data: '2030-01-02', hora: 10, valor: 20 };
    const reservas: ReservaRepository = {
        criar: () => reserva,
        buscarPorId: () => reserva,
        listarPorSalaEData: () => [],
        listar: () => [],
        excluir: () => { deleted = true; return true; },
    };
    const salas: SalaRepository = {
        criar: () => { throw new Error('Não utilizado'); },
        buscarPorId: () => undefined,
        listarTodas: () => [],
        atualizar: () => { throw new Error('Não utilizado'); },
        excluir: () => { },
        possuiReservasFuturas: () => false,
    };
    let now = new Date(2030, 0, 2, 10);
    const cases = createReservaUseCases(reservas, salas, { now: () => now });
    const cliente = { id: 2, tipo: 'CLIENTE' as const };
    assert.throws(() => cases.cancelarReserva(1, cliente), /Somente reservas futuras/);
    assert.equal(deleted, false);
    now = new Date(2030, 0, 2, 9, 59, 59);
    cases.cancelarReserva(1, cliente);
    assert.equal(deleted, true);
});
