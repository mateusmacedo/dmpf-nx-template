# Onboarding

Este guia leva um clone novo do `nx-base-template` até o primeiro PR.

Este repositório é um **template**: ele não traz apps prontas. O caminho normal é
clonar, validar o ambiente e então gerar a primeira app ou lib do seu projeto.

## Pré-requisitos

- Node.js `^24` (ver `.nvmrc` / `.node-version`).
- `pnpm@11.14.0`, conforme `packageManager` em `package.json`.
- Corepack habilitado, para usar exatamente a versão declarada do pnpm.

Para o dia a dia com o workspace e, opcionalmente, com o plugin `mmda-flow`
(ver a seção seguinte), tenha também estas ferramentas de linha de comando:

- `git` — controle de versão do repositório.
- `node` — runtime dos scripts (já coberto pelo requisito de Node.js `^24`).
- `python3` — usado por scripts auxiliares do plugin `mmda-flow`.
- `jq` — processamento de JSON em scripts e automações.
- `yq` (implementação do mikefarah) — processamento de YAML; confirme a origem
  com `yq --version`, cuja saída menciona `mikefarah/yq`.

O binário `gh` (GitHub CLI) só é necessário quando o fluxo do desenvolvedor
envolve GitHub. A plataforma deste projeto é **Gitea** (`gitea.lidercap.com.br`)
e não depende do `gh` — a automação que fala com a plataforma usa a API do
Gitea (`/api/v1/...`).

```bash
corepack enable
node --version
pnpm --version
git --version
python3 --version
jq --version
yq --version
```

## Instalação

```bash
pnpm install
```

O `pnpm install` também executa o script `prepare`, que instala o `lefthook`. O
script é tolerante a falha (`lefthook install || true`), então a instalação não
quebra em ambientes sem o binário — mas nesse caso os hooks locais não ficam
ativos.

As versões de dependências são centralizadas no `catalog:` do
`pnpm-workspace.yaml`. Cada `package.json` referencia `"catalog:"` em vez de fixar
a versão. O mesmo arquivo tem `allowBuilds`, a allowlist de scripts de
postinstall: pacotes marcados como `false` estão bloqueados de propósito.

## Plugin mmda-flow (opcional)

O plugin `mmda-flow` é opcional. O template funciona por completo sem ele; o
plugin agrega uma camada de pipeline e de processo por cima do que já existe.

Instale-o pelo marketplace de plugins do Claude Code, a partir do repositório
`https://github.com/mateusmacedo/plugins-claude`.

### Precedência entre plugin e template

- O plugin fornece **pipeline e processo** (feature pipeline, gates de
  qualidade e fluxo de entrega).
- O `.claude/skills/` do template fornece **domínio e stack** (NestJS, Jest,
  TypeScript, Go, review e demais convenções deste monorepo).

Quando as duas fontes tratarem do mesmo assunto, tome o processo do plugin e o
conhecimento de domínio e de stack das skills do template.

### Incompatibilidade de fluxo de PR

A rule `rules/git-workflow.md` do plugin declara substituir fluxos em que
`develop` é branch de integração e impõe "PR sempre para a branch principal",
sem precedência para `develop` como base. Ela resolve a branch principal via
`gh repo view --json defaultBranchRef`, comando que não opera contra Gitea.

Este projeto adota o fluxo inverso: a feature vai primeiro para `develop`
(validação) e só depois a **mesma** árvore é promovida para `release/X.Y.Z` e,
por fim, para `master` (ver `AGENTS.md` e `CONTRIBUTING.md`).

Essa incompatibilidade significa que, para abrir pull request neste projeto,
você deve seguir o fluxo descrito em `docs/guides/development-workflow.md`.
Mantenha desligados os pipelines do plugin que criam PR — a skill de commit/push
(`mmda-flow:skill-commit-push`) e, por delegar a ela, a
`mmda-flow:skill-feature-pipeline` —, porque a resolução de base por `gh` falha
contra Gitea e a regra de base do plugin contraria o fluxo `develop` →
`release` → `master` deste repositório.

## O que já existe no workspace

```bash
pnpm nx show projects
```

Hoje isso retorna apenas as duas libs compartilhadas e o metadado raiz:

| Projeto Nx | Caminho |
| --- | --- |
| `@Lidercap-apps/shared-types` | `libs/shared/types` |
| `@Lidercap-apps/shared-utils` | `libs/shared/utils` |
| `@nx-base-template/source` | raiz (metadado, sem código) |

## Criar a primeira app ou lib

Use os generators do Nx. O guia completo, com as flags e o que cada generator
cria, está em `docs/nx-reference/tasks.md`.

```bash
# lib compartilhada
pnpm nx g @nx/js:lib libs/shared/<name> \
  --importPath=@Lidercap-apps/shared-<name> \
  --bundler=tsc --unitTestRunner=jest --linter=none \
  --tags=type:lib,scope:shared,stack:node

# depois de gerar, sincronize as Project References da raiz
pnpm nx sync
```

Todo projeto novo nasce com as três tags obrigatórias (`type:`, `scope:`,
`stack:`) — o Nx Release seleciona o que publicar por `tag:type:lib`.

## Comandos de validação

Os scripts raiz existem para conveniência:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Quando documentar ou executar tarefas Nx diretamente, prefira `pnpm nx`:

```bash
pnpm nx run-many -t lint
pnpm nx run-many -t typecheck
pnpm nx run-many -t test
pnpm nx run-many -t build
pnpm nx test @Lidercap-apps/shared-utils
pnpm nx build @Lidercap-apps/shared-types
```

Para rodar um único arquivo de teste, o passthrough vai direto ao Jest 30 — a flag
é `--testPathPatterns`, no plural:

```bash
pnpm nx test @Lidercap-apps/shared-utils --testPathPatterns="string"
```

## Projetos afetados

Para validar somente o impacto da mudança:

```bash
pnpm nx affected -t lint
pnpm nx affected -t typecheck
pnpm nx affected -t test
pnpm nx affected -t build
```

O pre-push usa esse padrão e exclui `@nx-base-template/source`.

## Hooks locais

O `lefthook.yml` define:

- Pre-commit: `pnpm biome check --write` nos arquivos staged compatíveis, com
  `stage_fixed: true`.
- Pre-push: `pnpm nx affected -t lint`, `typecheck`, `test` e `build`, com
  `--parallel=3` e `--exclude=@nx-base-template/source`.

Se um hook alterar arquivos no pre-commit, revise o diff antes de concluir o
commit.

## CI

O workflow `.github/workflows/ci.yml` roda em PRs para `master`, `develop` e
`release/**`, no runner `gitea-runner`. A pipeline executa `pnpm biome ci .` e
depois `nx affected` de lint, typecheck, test (com `--ci --coverage`), build e
e2e.

Nota importante: o CI ignora mudanças que sejam apenas Markdown (`paths-ignore`
com `**/*.md` e `.github/ISSUE_TEMPLATE/**`). PRs só de documentação não disparam
o pipeline e precisam de revisão humana.

## Release e plataforma

- A plataforma é **Gitea** (`gitea.lidercap.com.br`). O binário `gh` não opera
  contra este servidor — ver `docs/adr/005-plataforma-gitea.md`.
- O versionamento (`release.yml`) é separado da publicação de libs
  (`publish-libs.yml`) — ver `docs/adr/004-workflows-verdaccio-release.md`.
- O `create-release.yml` cria a branch `release/X.Y.Z` e abre o PR de release pela
  API do Gitea.

## CD (deploy)

O template não traz um pipeline de deploy ligado. O que existe é um **guia de
adoção** com o modelo de referência e um workflow de CD parametrizado por
placeholder, para você preencher com a infraestrutura do seu projeto:

- `docs/ci-cd/README.md`
- `docs/ci-cd/DEPLOY_APPLICATIONS.md`
- `docs/ci-cd/EXPANSION_MODELS.md`

## Checklist do primeiro PR

- [ ] Criar uma branch fora de `master` e `develop`, como `docs/descricao-curta`
      ou `feat/descricao-curta`.
- [ ] Antes do PR para `develop`, mergear `release/X.Y.Z` na branch (ver
      anti-drift em `CONTRIBUTING.md`).
- [ ] Rodar `pnpm install` e confirmar que os hooks do lefthook ficaram ativos.
- [ ] Validar a mudança com scripts raiz ou `pnpm nx affected -t ...` conforme o
      escopo.
- [ ] Conferir se o `lefthook` não deixou arquivos modificados sem stage.
- [ ] Abrir PR com descrição objetiva do que mudou e da validação executada.
- [ ] Após validação em `develop`, promover a **mesma** árvore para
      `release/X.Y.Z` (não reescrever a feature).

## Planos e checkpoints locais

O diretório `plans` está listado no `.gitignore` (linha 51). Planos e
checkpoints são artefatos **locais e não versionados**: descrevem trabalho em
andamento e não seguem no clone do repositório.

Por isso, mantenha o racional durável de uma decisão na spec (`docs/specs/`) ou
em um ADR (`docs/adr/`), nunca apenas no plano. Migre para um artefato
versionado o conhecimento que precisa sobreviver ao plano antes de descartá-lo.

## Sincronização com tracker

A sincronização com um tracker (Linear, Jira) é responsabilidade do plugin
`mmda-flow`, quando a organização o adotar. Este template não exige campos de
tracker: você pode contribuir e abrir PRs sem preencher nenhum identificador de
issue externo.

## Onde continuar lendo

- `README.md` — mapa do monorepo e visão multistack.
- `AGENTS.md` — convenções, comandos e inventário para agentes e humanos.
- `CONTRIBUTING.md` — regras curtas de contribuição e modelo anti-drift.
- `docs/nx-reference/tasks.md` — configuração de tasks, cache e generators.
- `docs/ci-cd/` — guia de adoção de CI/CD e deploy.
- `docs/adr/` — decisões arquiteturais.
- `docs/specs/` — specs do projeto.
- `docs/guides/development-workflow.md` — fluxo detalhado do dia a dia:
  branches, commits, pull requests e validação.
- `docs/specs/README.md` — ciclo de vida e template das especificações.
- `docs/rules/README.md` — catálogo centralizado das regras do projeto.
- `docs/adr/README.md` — índice das decisões arquiteturais registradas.
- `.claude/README.md` — índice de agentes, skills e rules versionados.
