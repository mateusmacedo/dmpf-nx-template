# nx-base-template

Baseline de monorepo Nx multistack — Express, Fastify, NestJS, Next.js, Angular e
bounded contexts Go do DMPF no mesmo workspace.

## Pré-requisitos

- Node.js `24` (ver `.nvmrc` / `.node-version`)
- pnpm `11` (habilite via `corepack enable`)
- Go na diretiva do `go.work` (`1.26.10` com o `@mateusmacedo/dmpf-plugin` `1.0.0-rc.7`), `bash`, `jq` e `git`
- Token do GitHub com o escopo `read:packages`, porque o `@mateusmacedo/dmpf-plugin` vem do
  GitHub Packages, que exige autenticação até para pacote público

O `.npmrc` do repositório só aponta o escopo `@mateusmacedo` para o registry. A credencial
fica no `.npmrc` do seu usuário: desde a 11.5.3, o pnpm ignora `${VAR}` em credencial do
`.npmrc` do projeto (GHSA-3qhv-2rgh-x77r).

```bash
# ~/.npmrc — o arquivo guarda a variável, não o token
echo '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}' >> ~/.npmrc

# crie o token em https://github.com/settings/tokens com read:packages
export NODE_AUTH_TOKEN=<token>
```

## Quick Start

```bash
corepack enable          # ativa o pnpm na versão de packageManager
pnpm install             # instala deps e registra os git hooks (Lefthook)
pnpm nx run-many -t build # build incremental de tudo
```

As versões de dependências são centralizadas no `catalog:` do
`pnpm-workspace.yaml` — cada `package.json` referencia `"catalog:"`.

## Quickstart greenfield (DMPF)

O template já traz a saída do `init` do `@mateusmacedo/dmpf-plugin` com o module path
reservado `example.com/change-me`. Para um projeto novo:

```bash
# 1. repositório a partir do template
gh repo create <org>/<repo> --template mateusmacedo/dmpf-nx-template --private --clone
cd <repo>

# 2. dependências (com a credencial dos pré-requisitos)
pnpm install

# 3. module path e nome do projeto Compose do projeto
pnpm nx g @mateusmacedo/dmpf-plugin:init --modulePrefix=github.com/<org>/<repo> \
  --composeProject=<repo> --no-interactive
```

O `init` não reescreve a semente `infra/local/docker-compose.yml`: troque à mão o
`name: nx-base-template-local` dela por `<repo>-local`. Enquanto o prefixo for
`example.com/change-me`, o `bounded-context` recusa rodar e imprime o comando do passo 3.

```bash
# 4. primeiro bounded context
pnpm nx g @mateusmacedo/dmpf-plugin:bounded-context <contexto> --boundedContext=<contexto>
pnpm nx run-many -t tidy
CONFORMANCE="$(jq -r .conformance node_modules/@mateusmacedo/dmpf-plugin/versions.json)"
go run "github.com/mateusmacedo/dmpf/tools/dmpf-conformance/cmd/conformance@$CONFORMANCE" \
  --root . --write-baseline
```

O generator não cria o `.proto` do contrato, e contrato vazio reprova no buf. Crie o
primeiro serviço em `apps/backend/<contexto>/contract/proto/` antes dos gates; o guia
[`docs/guides/primeiro-bounded-context.md`](docs/guides/primeiro-bounded-context.md)
mostra um exemplo e a sequência completa de gates.

```bash
# 5. gates locais
pnpm nx run-many -t buf-lint
go run "github.com/mateusmacedo/dmpf/tools/dmpf-conformance/cmd/conformance@$CONFORMANCE" --root .
```

No PR, o `ci.yml` e o `dmpf-ci.yml` precisam passar. Para atualizar o DMPF, kernel e
plugin sobem juntos:

```bash
pnpm nx migrate @mateusmacedo/dmpf-plugin@<nova-versão>
pnpm install
pnpm nx migrate --run-migrations
```

## Stack suportada

| Stack                     | Tipo        | Plugin Nx                     |
| ------------------------- | ----------- | ----------------------------- |
| Node.js / TypeScript puro | libs        | `@nx/js`                      |
| Express                   | apps        | `@nx/express` + `@nx/webpack` |
| Fastify                   | apps        | `@nx/node` + `@nx/webpack`    |
| NestJS                    | apps + libs | `@nx/nest` + `@nx/webpack`    |
| Next.js                   | apps + libs | `@nx/next`                    |
| Angular                   | apps + libs | `@nx/angular`                 |
| Go / DMPF                 | bounded contexts (apps + contrato) | `@nx-go/nx-go` + `@mateusmacedo/dmpf-plugin` |

## Estrutura de diretórios

O template não traz apps nem libs: os diretórios de `apps/` e `libs/` são destinos, sem
projeto Nx registrado. A fonte de verdade dos projetos é `pnpm nx show projects`.

```text
nx-base-template/
├── apps/
│   ├── backend/                    # placeholder — sem projeto Nx
│   ├── frontend/                   # placeholder — sem projeto Nx
│   └── serverless/                 # placeholder — sem projeto Nx
├── libs/
│   ├── backend/                    # placeholder — sem projeto Nx
│   ├── frontend/                   # placeholder — sem projeto Nx
│   └── shared/                     # placeholder — sem projeto Nx
├── docs/
│   ├── adr/                        # ADRs (faixa 001-099 do template)
│   ├── specs/                      # catálogo e template de specs (SPEC-XXXX)
│   ├── analises/                   # análises que embasam specs
│   ├── rules/                      # regras de domínio (BIZ-, APP-, PRD-)
│   ├── guides/                     # fluxo de trabalho e primeiro bounded context
│   ├── nx-reference/               # guia prático de tasks Nx e taxonomia de tags
│   ├── ci-cd/                      # adoção de CI/CD e deploy
│   └── onboarding.md               # setup local, primeiro PR e derivação
├── infra/
│   ├── docker/                     # Dockerfile de referência
│   └── local/, k8s/, observability/, test/  # saída do dmpf-plugin — não editar à mão
├── tools/
│   ├── adr-verify.mjs              # verificador do acervo de ADRs
│   ├── tests/adr-verify/           # testes do verificador
│   ├── dmpf-baseline/              # baseline de conformidade (saída do dmpf-plugin)
│   └── template-smoke.sh           # smoke do template (contexto descartável)
├── .agents/skills/                 # skills de workspace (Nx) e dmpf-* (saída do dmpf-plugin)
├── .claude/                        # agents, skills e rules para assistentes
├── .github/workflows/              # CI, release, publish, cache, gates agendados e CD (template)
├── dmpf.json                       # configuração do DMPF (saída do init)
├── go.work                         # workspace Go (diretiva do dmpf-plugin)
├── biome.json                      # Biome (lint + formatação)
├── jest.preset.js                  # preset Jest com SWC
├── .spec.swcrc                     # SWC dos testes (decorators)
├── lefthook.yml
├── nx.json
├── package.json
├── pnpm-workspace.yaml             # workspaces e catalog de versões
└── tsconfig.base.json              # TypeScript Project References (nodenext)
```

Apps Nest criadas a partir daqui seguem tipicamente `src/app/<feature>/` (controllers,
services e DTOs colocalizados). Libs exportam pela `src/index.ts` do pacote.

## Convenção de tags (obrigatória em todo project.json)

Cada projeto deve declarar uma tag de cada dimensão:

```json
{
  "tags": ["type:app", "scope:backend", "stack:nest"]
}
```

| Dimensão | Valores                                                 |
| -------- | ------------------------------------------------------- |
| `type:`  | `app`, `lib`, `e2e`                                     |
| `scope:` | `shared`, `backend`, `frontend`                         |
| `stack:` | `node`, `express`, `fastify`, `nest`, `next`, `react`, `angular`, `go`, `universal` |

Os projetos Go gerados pelo `bounded-context` levam também uma tag `layer:`, que marca a
camada do contexto (por exemplo, `layer:contract` e `layer:apps`). Ela vem do plugin e não
deve ser editada à mão.

## Comandos principais

```bash
# Rodar testes de uma lib
pnpm nx test @mateusmacedo/minha-lib

# Rodar lint apenas nos projetos afetados pelo último commit
pnpm nx affected -t lint

# Typecheck incremental de tudo
pnpm nx run-many -t typecheck

# Build incremental de tudo
pnpm nx run-many -t build

# Ver grafo de dependências
pnpm nx graph

# Gerar nova shared lib
pnpm nx g @nx/js:lib libs/shared/minha-lib \
  --importPath=@mateusmacedo/minha-lib \
  --bundler=tsc --unitTestRunner=jest --linter=none \
  --tags=type:lib,scope:shared,stack:node
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

1. `format:check` — Biome (`biome ci`)
2. `lint` — Biome
3. `typecheck` — TypeScript Project References
4. `test` — Jest + SWC
5. `build` — build incremental
6. `e2e` — testes E2E

Os projetos Go (`tag:stack:go`) ficam fora desse pipeline e passam pelo
`.github/workflows/dmpf-ci.yml`, que chama o workflow reutilizável do platform fixado por
SHA. No template, sem nenhum módulo Go, esse workflow reprova no `modsync --check` quando o diff
liga os gates globais (`package.json`, `pnpm-lock.yaml`, `go.work` ou `go.mod`): ele não é check
obrigatório e passa a valer no projeto derivado a partir do primeiro contexto.

O job `template-smoke` do `ci.yml` roda `tools/template-smoke.sh` enquanto o `modulePrefix` do
`dmpf.json` for o reservado `example.com/change-me` (no derivado, o job fica inerte). Ele copia o working tree
para um repositório descartável, gera um bounded context e passa pelos gates do DMPF. Para
rodar localmente: `bash tools/template-smoke.sh`.

## Testes

Os testes usam Jest com transform via SWC (`.spec.swcrc`).

```bash
# Testar uma lib específica
pnpm nx test @mateusmacedo/minha-lib

# Testar apenas os projetos afetados
pnpm nx affected -t test

# Testar tudo
pnpm nx run-many -t test
```

## Troubleshooting

- **`ERR_PNPM_IGNORED_BUILDS`**: um pacote com script de build não está em
  `allowBuilds` no `pnpm-workspace.yaml`. Adicione o pacote com valor `true`.
- **Versão de Node/pnpm incompatível**: rode `corepack enable` e use a versão
  do `.nvmrc` (`nvm use`). O `engines` do `package.json` exige Node `^24` / pnpm `^11`.
- **`ERR_PNPM_FETCH_401` em `npm.pkg.github.com`**: falta a credencial do GitHub Packages.
  Confira a linha do `~/.npmrc` e o `NODE_AUTH_TOKEN` com `read:packages` (ver
  Pré-requisitos).
- **Cache desatualizado do Nx**: rode com `--skip-nx-cache` ou `pnpm nx reset`.
- **Erro de dependência no lockfile**: rode `pnpm install` e confira o diff de
  `pnpm-lock.yaml`; para CI use `pnpm install --frozen-lockfile`.

## Decisões arquiteturais

Consulte `docs/adr/` para o registro de decisões.
ADR-001 cobre a escolha do baseline e os fundamentos técnicos.
