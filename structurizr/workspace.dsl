workspace "Coworking Monte Horebe" "Arquitetura C4 da API de reservas, organizada em camadas de Clean Architecture conforme o código existente." {

    model {
        cliente = person "Cliente" "Consulta salas, horários e faz/cancela reservas" {
            tags "Cliente"
        }

        administrador = person "Administrador" "Gerencia salas e acompanha reservas" {
            tags "Administrador"
        }

        midia = softwareSystem "Armazenamento de Mídia" "Armazena imagens pesadas de perfil, fotos das salas e anexos enviados pelos usuários" {
            tags "Externo"
        }

        email = softwareSystem "Sistema de E-mail" "Serviço externo para envio de confirmações, lembretes e cancelamentos de reservas." {
            tags "Externo"
        }

        coworking = softwareSystem "MH Coworking" "Plataforma de reservas de salas e espaços de coworking." {
            app = container "App Mobile (FrontEnd)" "Fornece todas as funcionalidades de consulta, reserva de salas e gestão administrativa via dispositivos móveis." "React Native / TypeScript"

            api = container "API (Backend)" "Fornece a lógica de negócios de reservas e autenticação via API JSON/HTTPS, serve imagens estáticas (/public) e documentação Swagger (/docs)." "Node.js, Express 5, JavaScript, bcrypt" {
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

            banco = container "Database" "Armazena usuários, salas e reservas" "SQLite3 (database.db)" {
                tags "Database"
            }

            administrador -> app "Gerencia salas e acompanha reservas usando" "HTTPS"
            cliente -> app "Consulta salas e faz/cancela reservas usando" "HTTPS"
            app -> api "Faz chamadas de API para" "JSON / HTTPS / JWT"
            app -> midia "Baixa/carrega imagens diretamente de" "HTTPS"
            api -> midia "Realiza upload e obtém URLs de imagens em" "HTTPS / API"
            api -> email "Dispara e-mails transacionais via" "SMTP / API"
            api -> banco "Lê e grava usuários, salas e reservas em" "SQL (better-sqlite3)"
            app -> usuarioRoutes "Cadastro, login e perfil" "JSON/HTTPS"
            app -> salaRoutes "Consulta e administra salas" "JSON/HTTPS"
            app -> reservaRoutes "Consulta horários, cria e cancela reservas" "JSON/HTTPS"

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
            autoLayout tb
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
                background "#08427b"
                color "#ffffff"
                shape Person
            }
            element "Administrador" {
                background "#08427b"
                color "#ffffff"
                shape Person
            }
            element "Software System" {
                background "#0f766e"
                color "#ffffff"
            }
            element "Container" {
                background "#438dd5"
                color "#ffffff"
            }
            element "Component" {
                background "#2563eb"
                color "#ffffff"
            }
            element "Database" {
                background "#438dd5"
                color "#ffffff"
                shape Cylinder
            }
            element "Externo" {
                background "#999999"
                color "#ffffff"
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
