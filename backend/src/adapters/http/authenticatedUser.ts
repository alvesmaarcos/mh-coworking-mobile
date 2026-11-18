import type { Request } from 'express';
import type { UsuarioAutenticado, Perfil } from '../../domain/models.js';
declare global {
    namespace Express {
        interface Request {
            usuarioId?: number;
            usuarioTipo?: Perfil;
        }
    }
}
export function obterUsuario(req: Request): UsuarioAutenticado {
    return { id: req.usuarioId!, tipo: req.usuarioTipo! };
}
