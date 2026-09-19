import usuarioService from "../services/usuarioService.js";

async function cadastrar(req, res, next) {
  try {
    const { nome, email, senha } = req.body;
    
    const usuario = await usuarioService.cadastrarUsuario(nome, email, senha);

    delete usuario.senha;

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    const { usuario, token } = await usuarioService.login(email, senha);

    delete usuario.senha;

    res.status(200).json({ usuario, token });
  } catch (error) {
    next(error);
  }
}

export default { cadastrar, login };
