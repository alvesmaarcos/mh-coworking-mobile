# Fluxos de Acesso: Cadastro e Login

## 1. Cadastro de Usuário
- **Método:** `POST`
- **Caminho:** `/usuarios`
- **Para que serve:** Cria uma nova conta de cliente no sistema.
- **Quem pode acessar:** Público.
- **Headers necessários:** Nenhum.

**Corpo da requisição (JSON):**
\`\`\`json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha-segura-123"
}
\`\`\`

**Resposta de sucesso (HTTP 201 Created):**
\`\`\`json
{
  "id": 2,
  "nome": "João Silva",
  "email": "joao@email.com",
  "tipo": "CLIENTE"
}
\`\`\`

**Erros possíveis:**
- `400 Bad Request`: "Nome, email e senha são obrigatórios" (Campos vazios)
- `400 Bad Request`: "O email informado é inválido" (Falta de '@')
- `400 Bad Request`: "A senha deve ter pelo menos 6 caracteres"
- `409 Conflict`: "Email já cadastrado"

**Teste:**
1. 200 OK - Cadastro realizado com sucesso.
![Print do Cadastro no Insomnia](./img/cadastro/sucesso/cadastro.png)

2. 400 Bad Request - Campos obrigatórios não preenchidos.
- Nome ausente
![Nome ausente no Cadastro](./img/cadastro/erro/nome-ausente.png)
- Email ausente
![E-mail ausente no Cadastro](./img/cadastro/erro/email-ausente.png)
- Senha ausente
![Senha ausente no Cadastro](./img/cadastro/erro/senha-ausente.png)
- Email inválido
![E-mail inválido no Cadastro](./img/cadastro/erro/email-invalido.png)
- Senha com menos de seis caracteres
![Senha inválida no Cadastro](./img/cadastro/erro/senha-3-caracteres.png)
---

## 2. Login de Usuário
- **Método:** `POST`
- **Caminho:** `/login`
- **Para que serve:** Autentica um usuário existente.
- **Quem pode acessar:** Público.
- **Headers necessários:** Nenhum.

**Corpo da requisição (JSON):**
\`\`\`json
{
  "email": "joao@email.com",
  "senha": "senha-segura-123"
}
\`\`\`

**Resposta de sucesso (HTTP 200 OK):**
\`\`\`json
{
  "id": 2,
  "nome": "João Silva",
  "email": "joao@email.com",
  "tipo": "CLIENTE"
}
\`\`\`

**Erros possíveis:**
- `400 Bad Request`: "Email e senha são obrigatórios"
- `401 Unauthorized`: "Email ou senha inválidos"

**Testes**
- Login administrador
![Login adm realizado com sucesso](./img/login/sucesso/login-adm.png)

- Login cliente
![Login cliente realizado com sucesso](./img/login/sucesso/login-cliente.png)

- 400 Bad Request - Campos obrigatórios não preenchidos.
- Email ausente
![E-mail ausente no Login](./img/login/erro/email-ausente.png)
- Senha ausente
![Senha ausente no Login](./img/login/erro/senha-ausente.png)

- 401 Unauthorized - Email ou senha inválidos
- Email incorreta
![E-mail incorreto no Login](./img/login/erro/email-incorreto.png)
- Senha incorreta
![Senha incorreta no Login](./img/login/erro/senha-incorreta.png)