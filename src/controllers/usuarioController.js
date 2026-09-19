import usuarioService from "../services/usuarioService.js";

function cadastrar(req, res, next) {
  try {
    const { nome, email, senha } = req.body;
    //console.log("controller", nome, email, senha)
    const usuario = usuarioService.cadastrarUsuario(nome, email, senha);

    delete usuario.senha;

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    const usuario = usuarioService.login(email, senha);

    delete usuario.senha;

    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
}

export default { cadastrar, login };
