import type { Request, Response, NextFunction } from 'express';
import type { createReservaUseCases } from '../../../application/use-cases/reservaUseCases.js';
import { obterUsuario } from '../authenticatedUser.js';
export function createReservaController(reservaService: ReturnType<typeof createReservaUseCases>) {
    async function horarios(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { data } = req.query;
            const horarios = await reservaService.horariosDisponiveis(id as string, data);
            res.status(200).json(horarios);
        }
        catch (error) {
            next(error);
        }
    }
    async function criar(req: Request, res: Response, next: NextFunction) {
        try {
            const { sala_id, data, hora } = req.body;
            const reserva = await reservaService.criarReserva(obterUsuario(req), { sala_id, data, hora });
            res.status(201).json(reserva);
        }
        catch (error) {
            next(error);
        }
    }
    function listar(req: Request, res: Response, next: NextFunction) {
        try {
            const reservas = reservaService.listarReservas(obterUsuario(req), req.query);
            res.status(200).json(reservas);
        }
        catch (error) {
            next(error);
        }
    }
    function cancelar(req: Request, res: Response, next: NextFunction) {
        try {
            reservaService.cancelarReserva(req.params.id as string, obterUsuario(req));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    return { horarios, criar, listar, cancelar };
}
