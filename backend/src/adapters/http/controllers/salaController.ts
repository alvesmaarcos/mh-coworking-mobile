import type { Request, Response, NextFunction } from 'express';
import type { createSalaUseCases } from '../../../application/use-cases/salaUseCases.js';
import { obterUsuario } from '../authenticatedUser.js';
export function createSalaController(salaService: ReturnType<typeof createSalaUseCases>) {
    async function criar(req: Request, res: Response, next: NextFunction) {
        try {
            const { nome, descricao, atributos, valor_hora, imagem_url } = req.body;
            const sala = await salaService.criarSala({ nome, descricao, atributos, valor_hora, imagem_url }, obterUsuario(req));
            res.status(201).json(sala);
        }
        catch (error) {
            next(error);
        }
    }
    async function listar(req: Request, res: Response, next: NextFunction) {
        try {
            const salas = await salaService.listarSalas();
            res.status(200).json(salas);
        }
        catch (error) {
            next(error);
        }
    }
    async function buscarPorId(req: Request, res: Response, next: NextFunction) {
        try {
            const sala = await salaService.buscarSala(req.params.id as string);
            res.status(200).json(sala);
        }
        catch (error) {
            next(error);
        }
    }
    async function atualizar(req: Request, res: Response, next: NextFunction) {
        try {
            const { nome, descricao, atributos, valor_hora, imagem_url } = req.body;
            const sala = await salaService.atualizarSala(req.params.id as string, { nome, descricao, atributos, valor_hora, imagem_url }, obterUsuario(req));
            res.status(200).json(sala);
        }
        catch (error) {
            next(error);
        }
    }
    async function excluir(req: Request, res: Response, next: NextFunction) {
        try {
            await salaService.excluirSala(req.params.id as string, obterUsuario(req));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    return { criar, listar, buscarPorId, atualizar, excluir };
}
