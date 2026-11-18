import type { RequestHandler } from 'express';
import type { TokenService } from '../../application/ports.js';
import DomainError from '../../domain/DomainError.js';
export function createAuthMiddleware(tokens: TokenService): RequestHandler {
    return (req, _res, next) => {
        const header = req.headers.authorization;
        if (!header)
            return next(new DomainError('Token não fornecido', 'unauthorized'));
        const parts = header.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer')
            return next(new DomainError('Token mal formatado', 'unauthorized'));
        try {
            const decoded = tokens.verify(parts[1]);
            req.usuarioId = decoded.id;
            req.usuarioTipo = decoded.tipo;
        }
        catch {
            return next(new DomainError('Token inválido ou expirado', 'unauthorized'));
        }
        next();
    };
}
