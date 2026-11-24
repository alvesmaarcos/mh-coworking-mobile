# mh-coworking-mobile

## Equipe
- Anna Beatryz Arruda Ferreira - 566366
- Davi Sousa Facundo - 565910
- Enzo Hariel Ferreira Gaspar - 566785 (Mobile)
- Júlio Mateus Morais - 563850 (Arquitetura)
- Marcos Emanuel Alves Dias - 568099
- Rodrigo Rodrigues de Sousa - 570418
- Victor Emanuel Silva de Queiroz - 567683


## Como instalar as dependências do projeto e executar o servidor

1. Clone o repositório
2. Acesse a pasta do projeto
3. Execute `npm install` para instalar as dependências
4. Execute `npm run dev` para iniciar o servidor

## Aplicativo mobile — administrador

O frontend está em `frontend/`, com React Native, TypeScript e Expo. Use Node.js
22.13+, 24.3+ ou 26+ nas linhas de versão aceitas pelo Expo. Instale as dependências
na raiz com `npm install`. No PowerShell com scripts bloqueados, use `npm.cmd`.

### Executar no celular ou emulador

1. Configure o backend: copie `.env.example` para `.env`, se ainda não existir,
   e defina `JWT_SECRET`. O banco existente continua em `database.db` na raiz.
2. Execute `npm run dev` na raiz para iniciar a API na porta 3000.
3. Copie `frontend/.env.example` para `frontend/.env` e ajuste `EXPO_PUBLIC_API_URL`:
   - Emulador Android: `http://10.0.2.2:3000`.
   - Simulador iOS: `http://localhost:3000`.
   - Celular físico: endereço IPv4 do computador na rede, como `http://192.168.1.10:3000`.
     Computador e celular devem estar na mesma rede e a porta 3000 deve estar acessível.
4. Em outro terminal na raiz, execute `npm run dev:mobile`.
5. Abra pelo Expo Go compatível com SDK 58 ou pelo emulador. Após mudar a URL da
   API, reinicie o Expo. Essa variável é pública; nunca coloque a chave JWT nela.

Entre com uma conta `ADM`. Em um banco recém-criado, o administrador inicial é
`admin@montehorebe.com`, senha `admin123`. Credenciais já alteradas no banco são
preservadas. Contas `CLIENTE` não acessam essa interface.

### Funcionalidades

- Login real e sessão persistida no SecureStore do dispositivo. “Sair” limpa a
  sessão; respostas 401 direcionam ao login.
- “Próximas” lista reservas com início posterior ao horário atual, em ordem crescente.
- “Histórico” lista reservas cujo início chegou ou passou, em ordem decrescente,
  com o selo “Concluída”. O selo é derivado do horário, não de uma confirmação de uso.
- Filtros por sala e dia, combináveis, preservados ao alternar as abas.
- Cancelamento de reservas futuras, com confirmação e atualização após sucesso.
  A API exclui a reserva; canceladas não aparecem no histórico.
- Atualização ao puxar a lista e ao retornar ao app; classificação temporal a cada minuto.
- “Salas” e “Perfil” permanecem desabilitados nesta etapa.

Datas e horários seguem o horário local, como o backend. Configure dispositivo e
servidor no mesmo fuso do coworking para uma classificação consistente.

### Estrutura do frontend

- `src/domain`: modelos, classificação, ordenação e formatação de reservas.
- `src/application`: ciclo de sessão e proteção contra cancelamentos duplicados.
- `src/infrastructure`: cliente HTTP e armazenamento de sessão por plataforma.
- `src/ui`: telas, cartões, filtros, calendário e diálogos.

O frontend consome `POST /login`, `GET /salas`, `GET /reservas` e
`DELETE /reservas/:id`. Nenhuma rota, regra ou tabela do backend foi alterada.
O Swagger continua em `http://localhost:3000/docs`.

### Verificar e testar

Na raiz:

```sh
npm run typecheck:mobile
npm run test:mobile
npm run build:mobile
npm test
```

`build:mobile` exporta bundles Android, iOS e web em `frontend/dist/`; não gera APK/IPA.
Os comandos anteriores do backend (`dev`, `build`, `start`, `test`, `typecheck`)
continuam disponíveis.

Para verificar o visual no navegador sem mudar CORS da API:

```sh
npm run export:web --workspace @mh-coworking/frontend
npm run preview:web --workspace @mh-coworking/frontend
```

Abra `http://127.0.0.1:8081` com a API executando. Para essa exportação web,
remova `EXPO_PUBLIC_API_URL` do ambiente/`frontend/.env`, ou use `/api`, para usar
o proxy local. O proxy aponta para `http://127.0.0.1:3000` por padrão, configurável
por `API_URL`. A prévia web armazena a sessão apenas na aba (`sessionStorage`);
os builds nativos usam SecureStore.

Testes de interface com API real e banco **em memória**, sem tocar nos dados locais:

```sh
npm run build
npm run export:web --workspace @mh-coworking/frontend
npx playwright install chromium
npm run test:e2e --workspace @mh-coworking/frontend
```

Use `/api` como URL na exportação dos testes. No Windows, é possível usar o Edge
instalado com `$env:PLAYWRIGHT_CHANNEL='msedge'` antes do comando de testes,
dispensando o download do Chromium. Os testes usam as portas locais 4180 e 4199
e salvam capturas em `frontend/test-results/`, ignorado pelo Git.
