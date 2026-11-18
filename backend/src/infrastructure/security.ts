import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { PasswordHasher, TokenService } from '../application/ports.js';
import type { UsuarioAutenticado } from '../domain/models.js';
export const passwords: PasswordHasher = {
    hash: senha => bcrypt.hash(senha, 10),
    compare: (senha, hash) => bcrypt.compare(senha, hash),
};
export function createTokens(secret: string): TokenService {
    if (!secret.trim())
        throw new Error('Configure JWT_SECRET no arquivo .env da raiz ou no ambiente.');
    return {
        sign: usuario => jwt.sign(usuario, secret, { expiresIn: '1d' }),
        verify: token => jwt.verify(token, secret) as UsuarioAutenticado,
    };
}
