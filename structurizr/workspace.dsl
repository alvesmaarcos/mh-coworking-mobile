workspace "Coworking Monte Horebe" "Arquitetura C4 da API de reservas, organizada em camadas de Clean Architecture conforme o código existente." {

    model {
        cliente = person "Cliente" "Consulta salas e horários, cria e acompanha as próprias reservas." {
            tags "Cliente"
        }

        administrador = person "Administrador" "Mantém o catálogo de salas e consulta ou cancela reservas." {
            tags "Administrador"
        }

        coworking = softwareSystem "Plataforma de Reservas Monte Horebe" "API para cadastro de usuários, gestão de salas e reservas de espaços de coworking." {
            api = container "API de Reservas" "Expõe endpoints REST, autentica usuários e coordena as regras de aplicação." "Node.js, Express 5, JavaScript ES modules" {
                group "Adaptadores de entrada" {
                    bootstrap = component "Inicialização do servidor" "Abre o servidor HTTP na porta 3000." "src/app/server.js"
                    httpApp = component "Aplicação HTTP" "Configura JSON, arquivos públicos, documentação Swagger e tratamento de erros." "src/app/App.js"
                    rotas = component "Agregador de rotas" "Registra os módulos de rotas de usuários, salas e reservas." "src/routes/index.js"
                    usuarioRoutes = component "Rotas de usuários" "Expõe cadastro, login e operações do próprio perfil." "Express Router"
                    salaRoutes = component "Rotas de salas" "Expõe consulta pública e operações administrativas de salas." "Express Router"
                    reservaRoutes = component "Rotas de reservas" "Expõe consulta de horários, criação, listagem e cancelamento." "Express Router"
                    authMiddleware = component "Autenticação JWT" "Valida o bearer token e injeta o identificador e o tipo do usuário na requisição." "src/middlewares/auth.js"
                    usuarioController = component "Controller de usuários" "Traduz requisições e respostas HTTP para operações de usuário." "src/controllers/usuarioController.js"
                    salaController = component "Controller de salas" "Traduz requisições e respostas HTTP para operações de sala." "src/controllers/salaController.js"
                    reservaController = component "Controller de reservas" "Traduz requisições e respostas HTTP para operações de reserva." "src/controllers/reservaController.js"
                    docsApi = component "Documentação da API" "Publica o contrato OpenAPI e a interface Swagger UI." "swagger.yaml, swagger-ui-express"
                    arquivosPublicos = component "Arquivos públicos" "Entrega imagens estáticas das salas e dos espaços." "Diretório public/"
                }

                group "Aplicação e regras de negócio" {
                    usuarioService = component "Casos de uso de usuários" "Valida cadastro e perfil, verifica credenciais e coordena a emissão de JWT." "src/services/usuarioService.js"
                    salaService = component "Casos de uso de salas" "Aplica regras de cadastro, consulta, atualização e exclusão de salas." "src/services/salaService.js"
                    reservaService = component "Casos de uso de reservas" "Aplica regras de disponibilidade, conflito de horário, autorização e cancelamento." "src/services/reservaService.js"
                }

                group "Adaptadores de saída e persistência" {
                    usuarioRepository = component "Repositório de usuários" "Persiste contas, valida unicidade de e-mail e cria o administrador inicial." "src/repositories/usuarioRepository.js"
                    salaRepository = component "Repositório de salas" "Persiste e consulta salas e verifica reservas futuras." "src/repositories/salaRepository.js"
                    reservaRepository = component "Repositório de reservas" "Persiste reservas e consulta reservas por sala, data e usuário." "src/repositories/reservaRepository.js"
                    databaseAdapter = component "Conexão SQLite" "Abre database.db e fornece a conexão usada pelos repositórios." "src/repositories/database.js, better-sqlite3"
                }
            }

            banco = container "Banco de dados" "Armazena usuários, salas e reservas em um arquivo local." "SQLite (database.db)" {
                tags "Database"
            }

            cliente -> api "Usa a API para consultar salas e reservar espaços" "HTTP/JSON"
            administrador -> api "Administra salas e reservas" "HTTP/JSON"
            cliente -> usuarioRoutes "Cadastra-se e autentica-se" "HTTP/JSON"
            cliente -> salaRoutes "Consulta salas" "HTTP/JSON"
            cliente -> reservaRoutes "Consulta horários e solicita reservas" "HTTP/JSON"
            administrador -> salaRoutes "Administra salas" "HTTP/JSON"
            administrador -> reservaRoutes "Consulta e cancela reservas" "HTTP/JSON"
            api -> banco "Lê e grava os dados da aplicação" "SQLite"

            bootstrap -> httpApp "Inicia"
            httpApp -> rotas "Registra as rotas"
            httpApp -> docsApi "Disponibiliza /docs e /swagger.yaml"
            httpApp -> arquivosPublicos "Serve /public"
            rotas -> usuarioRoutes "Registra"
            rotas -> salaRoutes "Registra"
            rotas -> reservaRoutes "Registra"
            usuarioRoutes -> usuarioController "Encaminha operações de usuário"
            salaRoutes -> salaController "Encaminha operações de sala"
            reservaRoutes -> reservaController "Encaminha operações de reserva"
            salaRoutes -> authMiddleware "Protege operações administrativas"
            usuarioRoutes -> authMiddleware "Protege operações do perfil"
            reservaRoutes -> authMiddleware "Protege operações autenticadas"
            usuarioController -> usuarioService "Executa casos de uso"
            salaController -> salaService "Executa casos de uso"
            reservaController -> reservaService "Executa casos de uso"
            usuarioController -> cliente "Responde com usuário e token" "HTTP/JSON"
            salaController -> cliente "Responde com dados das salas" "HTTP/JSON"
            reservaController -> cliente "Responde com horários ou reserva" "HTTP/JSON"
            usuarioService -> usuarioRepository "Consulta e persiste usuários"
            salaService -> salaRepository "Consulta e persiste salas"
            reservaService -> salaRepository "Consulta sala e valor por hora"
            reservaService -> reservaRepository "Consulta e persiste reservas"
            usuarioRepository -> databaseAdapter "Executa consultas SQL"
            salaRepository -> databaseAdapter "Executa consultas SQL"
            reservaRepository -> databaseAdapter "Executa consultas SQL"
            databaseAdapter -> banco "Lê e grava" "SQLite"
        }

        codeServer = element "src/app/server.js" "Módulo JavaScript" "Ponto de entrada; inicia o servidor na porta 3000." "Code"
        codeApp = element "src/app/App.js" "Módulo JavaScript" "Configura o Express, Swagger UI, arquivos estáticos, rotas e erros." "Code"
        codeRoutes = element "src/routes/index.js" "Módulo JavaScript" "Agrega os módulos de rotas." "Code"
        codeUsuarioRoutes = element "src/routes/usuarioRoutes.js" "Módulo JavaScript" "Rotas de cadastro, login e perfil." "Code"
        codeSalaRoutes = element "src/routes/salaRoutes.js" "Módulo JavaScript" "Rotas de consulta e administração de salas." "Code"
        codeReservaRoutes = element "src/routes/reservaRoutes.js" "Módulo JavaScript" "Rotas de horários e reservas." "Code"
        codeAuth = element "src/middlewares/auth.js" "Módulo JavaScript" "Middleware de autenticação bearer JWT." "Code"
        codeUsuarioController = element "src/controllers/usuarioController.js" "Módulo JavaScript" "Adaptador HTTP para operações de usuário." "Code"
        codeSalaController = element "src/controllers/salaController.js" "Módulo JavaScript" "Adaptador HTTP para operações de sala." "Code"
        codeReservaController = element "src/controllers/reservaController.js" "Módulo JavaScript" "Adaptador HTTP para operações de reserva." "Code"
        codeUsuarioService = element "src/services/usuarioService.js" "Módulo JavaScript" "Regras e casos de uso de usuário." "Code"
        codeSalaService = element "src/services/salaService.js" "Módulo JavaScript" "Regras e casos de uso de sala." "Code"
        codeReservaService = element "src/services/reservaService.js" "Módulo JavaScript" "Regras e casos de uso de reserva." "Code"
        codeUsuarioRepository = element "src/repositories/usuarioRepository.js" "Módulo JavaScript" "Adaptador de persistência de usuário." "Code"
        codeSalaRepository = element "src/repositories/salaRepository.js" "Módulo JavaScript" "Adaptador de persistência de sala." "Code"
        codeReservaRepository = element "src/repositories/reservaRepository.js" "Módulo JavaScript" "Adaptador de persistência de reserva." "Code"
        codeDatabase = element "src/repositories/database.js" "Módulo JavaScript" "Conexão better-sqlite3 com database.db." "Code"

        codeServer -> codeApp "Importa a aplicação"
        codeApp -> codeRoutes "Registra as rotas"
        codeRoutes -> codeUsuarioRoutes "Agrega"
        codeRoutes -> codeSalaRoutes "Agrega"
        codeRoutes -> codeReservaRoutes "Agrega"
        codeUsuarioRoutes -> codeUsuarioController "Encaminha requisições"
        codeSalaRoutes -> codeSalaController "Encaminha requisições"
        codeReservaRoutes -> codeReservaController "Encaminha requisições"
        codeUsuarioRoutes -> codeAuth "Protege operações de perfil"
        codeSalaRoutes -> codeAuth "Protege operações administrativas"
        codeReservaRoutes -> codeAuth "Protege operações autenticadas"
        codeUsuarioController -> codeUsuarioService "Invoca"
        codeSalaController -> codeSalaService "Invoca"
        codeReservaController -> codeReservaService "Invoca"
        codeUsuarioService -> codeUsuarioRepository "Usa"
        codeSalaService -> codeSalaRepository "Usa"
        codeReservaService -> codeSalaRepository "Consulta sala"
        codeReservaService -> codeReservaRepository "Consulta e persiste"
        codeUsuarioRepository -> codeDatabase "Usa a conexão"
        codeSalaRepository -> codeDatabase "Usa a conexão"
        codeReservaRepository -> codeDatabase "Usa a conexão"
    }

    views {
        systemContext coworking "C1-contexto" {
            title "C1 — Contexto do sistema"
            include *
            autoLayout lr
        }

        container coworking "C2-containers" {
            title "C2 — Containers"
            include *
            autoLayout lr
        }

        component api "C3-componentes" {
            title "C3 — Componentes da API (Clean Architecture)"
            include *
            autoLayout lr 250 180
        }

        custom "C4-codigo" {
            title "C4 — Código: módulos e dependências"
            description "Mapa dos arquivos JavaScript existentes. No repositório, regras de negócio estão nos services; não há módulos separados de entidades nem interfaces explícitas de portas."
            include codeServer codeApp codeRoutes codeUsuarioRoutes codeSalaRoutes codeReservaRoutes codeAuth codeUsuarioController codeSalaController codeReservaController codeUsuarioService codeSalaService codeReservaService codeUsuarioRepository codeSalaRepository codeReservaRepository codeDatabase
            autoLayout lr 250 180
        }

        styles {
            element "Cliente" {
                background "#1d4ed8"
                color "#ffffff"
                shape Person
            }
            element "Administrador" {
                background "#7c3aed"
                color "#ffffff"
                shape Person
            }
            element "Software System" {
                background "#0f766e"
                color "#ffffff"
            }
            element "Container" {
                background "#0e7490"
                color "#ffffff"
            }
            element "Component" {
                background "#2563eb"
                color "#ffffff"
            }
            element "Database" {
                background "#475569"
                color "#ffffff"
                shape Cylinder
            }
            element "Code" {
                background "#334155"
                color "#ffffff"
                shape Component
            }
            relationship "Relationship" {
                color "#475569"
                thickness 2
            }
        }
    }
}
