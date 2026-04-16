# nx-base-template

Baseline de monorepo Nx multistack — Express, Fastify, NestJS, Next.js e Angular no mesmo workspace.

## Stack suportada

| Stack | Tipo | Plugin Nx |
|---|---|---|
| Node.js / TypeScript puro | libs | `@nx/js` |
| Express | apps | `@nx/express` + `@nx/webpack` |
| Fastify | apps | `@nx/node` + `@nx/webpack` |
| NestJS | apps + libs | `@nx/nest` + `@nx/webpack` |
| Next.js | apps + libs | `@nx/next` |
| Angular | apps + libs | `@nx/angular` |

## Estrutura de diretórios

```
nx-base-template/
├── apps/                        # Aplicações executáveis
│   └── <stack>-<name>/
│   └── <stack>-<name>-e2e/
├── libs/
│   ├── shared/                  # Libs agnósticas de framework (scope:shared)
│   │   ├── utils/               # Utilitários TypeScript puros
│   │   ├── types/               # Tipos e interfaces compartilhados
│   │   └── testing/             # Fixtures e helpers de teste
│   ├── backend/                 # Libs de servidor (scope:backend)
│   │   ├── domain/              # Lógica de domínio
│   │   ├── nest/                # Módulos NestJS reutilizáveis
│   │   └── infra/               # Adapters (DB, cache, queue)
│   ├── frontend/                # Libs de UI (scope:frontend)
│   │   ├── ui/                  # Componentes React/Next.js
│   │   └── angular/             # Componentes Angular
│   └── data-access/
│       └── api-client/          # Client HTTP compartilhado
├── tools/
│   ├── generators/              # Nx generators da organização
│   │   └── shared-lib/          # nx g @nx-base-template/tools:shared-lib
│   └── executors/               # Nx executors customizados
├── docs/
│   └── adr/                     # Architecture Decision Records
├── .github/workflows/ci.yml     # CI com nx affected
├── nx.json
├── tsconfig.base.json           # TypeScript Project References (nodenext)
├── pnpm-workspace.yaml          # apps/*, libs/**, tools/*
├── eslint.config.mjs            # ESLint + module boundaries
├── jest.config.ts               # Jest root
├── jest.preset.js               # Preset SWC
└── .spec.swcrc                  # Config SWC para testes (suporta decorators)
```

## Convenção de tags (obrigatória em todo project.json)

Cada projeto deve declarar uma tag de cada dimensão:

```json
{
  "tags": ["type:app", "scope:backend", "stack:nest"]
}
```

| Dimensão | Valores |
|---|---|
| `type:` | `app`, `lib`, `e2e` |
| `scope:` | `shared`, `backend`, `frontend` |
| `stack:` | `node`, `express`, `fastify`, `nest`, `next`, `angular` |

## Comandos principais

```bash
# Rodar testes da lib shared/utils
pnpm nx test @nx-base-template/shared-utils

# Rodar lint apenas nos projetos afetados pelo último commit
pnpm nx affected -t lint

# Typecheck incremental de tudo
pnpm nx run-many -t typecheck

# Build incremental de tudo
pnpm nx run-many -t build

# Ver grafo de dependências
pnpm nx graph

# Gerar nova shared lib
pnpm nx g @nx-base-template/tools:shared-lib my-lib
```

## Adicionar uma nova app

```bash
# Express
pnpm nx g @nx/express:app my-api --directory=apps/my-api

# NestJS
pnpm nx g @nx/nest:app my-nest-api --directory=apps/my-nest-api

# Next.js
pnpm nx g @nx/next:app my-web --directory=apps/my-web

# Angular
pnpm nx g @nx/angular:app my-angular --directory=apps/my-angular
```

Sempre adicione as tags obrigatórias no `project.json` gerado.

## CI/CD

O pipeline em `.github/workflows/ci.yml` executa sobre os projetos **afetados**
pela mudança (`nx affected`), na ordem:

1. `format:check` — Prettier
2. `lint` — ESLint + module boundaries
3. `typecheck` — TypeScript Project References
4. `test` — Jest + SWC
5. `build` — build incremental
6. `e2e` — testes E2E

## Decisões arquiteturais

Consulte `docs/adr/` para o registro de decisões.
ADR-001 cobre a escolha do baseline e os fundamentos técnicos.
