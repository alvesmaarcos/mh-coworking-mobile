import DomainError from '../../domain/DomainError.js';
import type { Id, UsuarioAutenticado } from '../../domain/models.js';
import type { UsuarioRepository, PasswordHasher, TokenService } from '../ports.js';
export function createUsuarioUseCases(usuarioRepository: UsuarioRepository, passwords: PasswordHasher, tokens: TokenService) {
    function verificarDono(id: Id, autenticado: UsuarioAutenticado) {
        if (String(autenticado.id) !== String(id))
            throw new DomainError("Você não tem permissão para acessar este recurso", "forbidden");
    }
    async function cadastrarUsuario(nome: string, email: string, senha: string) {
        if (!nome || !email || !senha) {
            throw new DomainError("Nome, email e senha são obrigatórios", "validation");
        }
        if (!email.includes("@")) {
            throw new DomainError("Email inválido", "validation");
        }
        if (senha.length < 6) {
            throw new DomainError("A senha deve conter pelo menos seis caracteres", "validation");
        }
        const user = usuarioRepository.buscarPorEmail(email);
        if (user) {
            throw new DomainError("Já existe um usuário cadastrado com este email", "conflict");
        }
        const senhaHash = await passwords.hash(senha);
        return usuarioRepository.criarUsuario({ nome, email, senha: senhaHash });
    }
    async function login(email: string, senha: string) {
        if (!email || !senha) {
            throw new DomainError("Email e senha são obrigatórios", "validation");
        }
        const usuario = usuarioRepository.buscarPorEmail(email);
        if (!usuario || !(await passwords.compare(senha, usuario.senha!))) {
            throw new DomainError("Email ou senha inválidos", "unauthorized");
        }
        // Gera o token JWT com duração de 1 dia
        const token = tokens.sign({ id: usuario.id, tipo: usuario.tipo });
        return { usuario, token };
    }
    async function buscarPorId(id: Id, autenticado: UsuarioAutenticado) {
        verificarDono(id, autenticado);
        const usuario = usuarioRepository.buscarPorId(id);
        if (!usuario) {
            throw new DomainError("Usuário não encontrado", "not_found");
        }
        return usuario;
    }
    async function atualizar(id: Id, { nome, email }: {
        nome: string;
        email: string;
    }, autenticado: UsuarioAutenticado) {
        verificarDono(id, autenticado);
        const usuario = usuarioRepository.buscarPorId(id);
        if (!usuario) {
            throw new DomainError("Usuário não encontrado", "not_found");
        }
        if (!nome || !email) {
            throw new DomainError("Nome e email são obrigatórios", "validation");
        }
        if (!email.includes("@")) {
            throw new DomainError("Email inválido", "validation");
        }
        const emailEmUso = usuarioRepository.buscarPorEmail(email);
        if (emailEmUso && emailEmUso.id !== Number(id)) {
            throw new DomainError("Já existe um usuário cadastrado com este email", "conflict");
        }
        usuarioRepository.atualizar(id, { nome, email });
        return usuarioRepository.buscarPorId(id)!;
    }
    async function excluir(id: Id, autenticado: UsuarioAutenticado) {
        verificarDono(id, autenticado);
        const usuario = usuarioRepository.buscarPorId(id);
        if (!usuario) {
            throw new DomainError("Usuário não encontrado", "not_found");
        }
        usuarioRepository.excluir(id);
    }
    return { cadastrarUsuario, login, buscarPorId, atualizar, excluir };
}
