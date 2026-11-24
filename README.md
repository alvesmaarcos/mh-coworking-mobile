# mh-coworking-mobile

## API

1. Execute `npm install` para instalar as dependências.
2. Execute `npm run dev` para iniciar a API na porta 3000.

## Diagramas C4 (Structurizr Lite)

Os diagramas da arquitetura estão definidos em [structurizr/workspace.dsl](./structurizr/workspace.dsl). O workspace inclui contexto, containers, componentes organizados segundo a Clean Architecture, um mapa dos módulos de código existentes e fluxos dinâmicos.

Para iniciar a visualização local com Docker Compose:

```sh
docker compose up -d
```

Abra <http://localhost:8080> para visualizar o workspace. Para encerrar o servidor:

```sh
docker compose down
```

O workspace é montado no container a partir do diretório `structurizr/`, então alterações no DSL ficam disponíveis ao servidor local.
Se seu usuário no host não tiver UID/GID `1000:1000`, informe os valores correspondentes nas variáveis `STRUCTURIZR_UID` e `STRUCTURIZR_GID` ao executar o Compose, para que o servidor possa gravar nesse diretório.

### Como ler a arquitetura

Os controllers e middlewares fazem parte dos adaptadores de entrada; os `services` concentram os casos de uso e regras de negócio; e os `repositories` são os adaptadores de persistência para SQLite. O desenho acompanha os módulos presentes no código: não há atualmente uma camada independente de entidades de domínio nem interfaces explícitas de portas entre serviços e repositórios.