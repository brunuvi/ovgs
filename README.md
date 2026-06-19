# OVGS — Sistema de Gestão de Ordens de Venda

Plataforma full-stack para gerir o ciclo de vida completo de **Ordens de Venda**:
cadastros, criação e acompanhamento de OVs com máquina de estados, central de
agendamento e trilha de auditoria.

**No ar:**
- App — https://ovgs.btechcore.com
- Swagger (API) — https://ovgs.btechcore.com/docs

---

## Tecnologias utilizadas

| Camada | Tecnologia |
| --- | --- |
| Back-end | Node.js · TypeScript · **NestJS 11** |
| ORM / BD | **Prisma 6** · **PostgreSQL 16** |
| Front-end | **React 18** · Vite · React Query · **Mantine** |
| Docs | OpenAPI / **Swagger** |
| Logs / Eventos | **pino** (logs estruturados) · `@nestjs/event-emitter` |
| Testes | **Jest** + Supertest |
| Infra | **Docker Compose** (db + api + web) · CI no GitHub Actions |

## Instruções de execução

Pré-requisito: Docker. Um comando sobe os três serviços, aplica as migrations e roda o seed:

```bash
docker compose up --build
```

| Serviço | URL |
| --- | --- |
| App (web) | http://localhost:8090 |
| Swagger | http://localhost:8090/docs |
| API | http://localhost:3033 · health em `/health` |
| Postgres | `localhost:5434` (user/pass/db: `ovgs`) |

Testes:

```bash
cd backend
npm test          # unitários (sem banco)
npm run test:e2e  # integração (requer PostgreSQL via DATABASE_URL)
```

> Dev sem Docker: `cd backend && npm i && npm run prisma:migrate && npm run prisma:seed && npm run start:dev`; e `cd frontend && npm i && npm run dev` (o Vite faz proxy de `/api` para a API).

## Regras de negócio

1. **Transporte autorizado** — OV só é criada se o transporte estiver autorizado para o cliente.
2. **Itens** — devem existir previamente; a OV exige ≥1 item.
3. **Máquina de estados** — `CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE`; transições inválidas retornam **409**.
4. **Agendamento** — `AGENDADA` exige agendamento **confirmado**; confirmar avança a OV pelos passos válidos até `AGENDADA`. Reagendar invalida a confirmação.
5. **Alterar transporte** — revalida a autorização; bloqueado após despacho.
6. **Auditoria** — criação de OV e mudança de status/agendamento/transporte geram eventos.

## Decisões arquiteturais

- **NestJS modular em camadas** (Controller → Service → Prisma), com injeção de dependências nativa e validação/exceções centralizadas.
- **Máquina de estados isolada** (`domain/order-state-machine.ts`): regra de transição pura, sem dependência de framework ou banco — testável e única fonte de transição.
- **Catálogo de transportes orientado a dados**: adicionar um tipo é inserir um registro; nenhum `switch`/`enum` no código muda (atende ao requisito de extensibilidade).
- **Auditoria event-driven** (`@nestjs/event-emitter`): a regra de negócio emite o evento e um listener persiste — desacoplado (falha de auditoria não derruba a operação) e pronto para evoluir a um broker/worker.
- **Validação na borda** (`class-validator` + `ValidationPipe` global) e **filtro global de exceções** que mapeia erros do Prisma (P2002→409, P2025→404, P2003→400).
- Padrões adicionais ficaram de fora por escopo (ver Trade-offs).

## Estratégia de modelagem do domínio

```
Client ─┬─< ClientTransportType >─┬─ TransportType
        │                          │
        └──────< SalesOrder >──────┘
                    │  │
                    │  └── Schedule (1:1)
                    └──< SalesOrderItem >── Item

AuditLog  (tabela transversal de eventos)
```

- **Client** — possui uma lista de **transportes autorizados** via tabela de junção `ClientTransportType` (N:N). A autorização é dado, não código.
- **TransportType** — modelado como **catálogo extensível** (`code` único); novos tipos não exigem mudança de regra.
- **Item** — pré-cadastrado, identificado por **SKU** único; vinculado à OV por `SalesOrderItem` (com quantidade).
- **SalesOrder** — agregado central: exatamente 1 cliente, 1 transporte, ≥1 item e um `status` (enum) governado pela máquina de estados.
- **Schedule** — agendamento 1:1 com a OV (data, janela, confirmação).
- **AuditLog** — tabela **genérica** de eventos (`action`, `entity`, `entityId`, `previousState`, `newState`, `metadata`), desacoplada das entidades de negócio.

## Estratégia de persistência

- **PostgreSQL + Prisma**, com schema versionado por **migrations** (`prisma/migrations`).
- **IDs `cuid`** gerados pela aplicação: evitam enumeração sequencial e permitem gerar a identidade antes do round-trip ao banco.
- **Índices** alinhados às consultas: `SalesOrder` (`status`, `clientId`, `transportTypeId`, `createdAt`) e `AuditLog` (`entity+entityId`, `action`, `createdAt`).
- **Transação** na criação da OV (código sequencial + itens) para consistência.
- **Auditoria append-only**, com estados anterior/posterior em colunas `Json`.

## Considerações sobre escalabilidade

- **API stateless** → escala horizontal atrás de um load balancer; o Postgres é a fonte de verdade.
- **Auditoria por eventos** → o listener pode migrar para uma fila (RabbitMQ/Kafka) + worker dedicado sem tocar nas regras de negócio.
- **Índices** alinhados aos filtros de leitura mais frequentes (monitoramento e auditoria).
- **Próximo passo**: paginação por cursor nas listagens (hoje há limite fixo na auditoria); o `cuid` favorece keyset pagination.

## Considerações sobre performance

- Consultas servidas por índices; `include` controlado para evitar over-fetch.
- Criação da OV em transação única (evita estados parciais e múltiplos round-trips).
- Logs estruturados com pino (baixo overhead).
- Cache (ex.: Redis para catálogos pouco mutáveis) é um próximo passo identificado, não incluído para manter o escopo consistente.

## Trade-offs assumidos

- **Código da OV por contagem** (`OV-000N`) em transação: simples e legível; sob altíssima concorrência uma **sequence** do Postgres seria mais robusta.
- **Sem autenticação/autorização**: fora do escopo central; a estrutura modular e o filtro de exceções deixam o ponto de extensão pronto (guards/roles).
- **Disponibilidade de agendamento simulada** (validação de janela coerente), como permitido pelo enunciado.
- **Auditoria assíncrona**: prioriza não bloquear a operação; em caso de falha o evento é logado (em produção, iria para uma DLQ).
- **Prisma no lugar do Repository clássico do TypeORM**: melhor type-safety e DX de migrations; o acesso a dados fica encapsulado nos services.

## API

Documentação interativa completa em **`/docs`** (Swagger). Principais rotas:

| Método | Rota | Descrição |
| --- | --- | --- |
| POST/PATCH | `/clients` · `/clients/:id` | Criar/editar cliente |
| POST | `/clients/:id/transport-types` | Autorizar transporte |
| POST/PATCH | `/transport-types` · `/transport-types/:id` | Cadastro de transporte |
| POST/GET | `/items` | Cadastro de itens |
| POST | `/sales-orders` | Criar OV |
| GET | `/sales-orders` | Listar/monitorar — `?status=&clientId=&transportTypeId=&dateFrom=&dateTo=` |
| GET | `/sales-orders/:id` | Detalhar OV |
| PATCH | `/sales-orders/:id/status` · `/transport` | Atualizar status / trocar transporte |
| POST/PATCH | `/sales-orders/:id/schedule[/confirm\|/reschedule]` | Agendar / confirmar / reagendar |
| GET | `/audit-logs` | Trilha de auditoria |

## Testes

Mínimo exigido (2 unitários + 1 integração) superado: **14 unitários + 7 e2e** — cobrindo a máquina de estados, a regra de transporte autorizado e o fluxo HTTP ponta a ponta (criação → status → agendamento → auditoria).

## Diferenciais implementados

OpenAPI/Swagger · auditoria event-driven · logs estruturados · filtro global de exceções + mapeamento de erros do Prisma · healthcheck · cobertura de testes acima do mínimo · CI (GitHub Actions) · deploy via Docker Compose + Cloudflare Tunnel.
