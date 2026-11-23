import type { Request, Response, NextFunction } from 'express';
import type { createUsuarioUseCases } from '../../../application/use-cases/usuarioUseCases.js';
import { obterUsuario } from '../authenticatedUser.js';
export function createUsuarioController(usuarioService: ReturnType<typeof createUsuarioUseCases>) {
    async function cadastrar(req: Request, res: Response, next: NextFunction) {
        try {
            const { nome, email, senha } = req.body;
            const usuario = await usuarioService.cadastrarUsuario(nome, email, senha);
            delete usuario.senha;
            res.status(201).json(usuario);
        }
        catch (error) {
            next(error);
        }
    }
    async function login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, senha } = req.body;
            const { usuario, token } = await usuarioService.login(email, senha);
            delete usuario.senha;
            res.status(200).json({ usuario, token });
        }
        catch (error) {
            next(error);
        }
    }
    async function buscarPorId(req: Request, res: Response, next: NextFunction) {
        try {
            const usuario = await usuarioService.buscarPorId(req.params.id as string, obterUsuario(req));
            delete usuario.senha;
            res.status(200).json(usuario);
        }
        catch (error) {
            next(error);
        }
    }
    async function atualizar(req: Request, res: Response, next: NextFunction) {
        try {
            const usuario = await usuarioService.atualizar(req.params.id as string, req.body ?? {}, obterUsuario(req));
            delete usuario.senha;
            res.status(200).json(usuario);
        }
        catch (error) {
            next(error);
        }
    }
    async function excluir(req: Request, res: Response, next: NextFunction) {
        try {
            await usuarioService.excluir(req.params.id as string, obterUsuario(req));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async function esqueciSenha(req: Request, res: Response, next: NextFunction) {
        try {
            await usuarioService.solicitarRecuperacao(req.body?.email);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async function redefinirSenha(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, codigo, senha } = req.body ?? {};
            await usuarioService.redefinirSenha(email, codigo, senha);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    return { cadastrar, login, buscarPorId, atualizar, excluir, esqueciSenha, redefinirSenha };
}
