# Onboarding

Este guia leva um clone novo do `nx-base-template` até o primeiro PR.

Este repositório é um **template**: ele não traz apps prontas. O caminho normal é
clonar, validar o ambiente e então gerar a primeira app ou lib do seu projeto.

## Pré-requisitos

- Node.js `^24` (ver `.nvmrc` / `.node-version`).
- `pnpm@11.14.0`, conforme `packageManager` em `package.json`.
- Corepack habilitado, para usar exatamente a versão declarada do pnpm.
- Go na diretiva do `go.work` (hoje `1.26.10`), exigido pelo `@mateusmacedo/dmpf-plugin`.
- Token do GitHub com o escopo `read:packages`: o `@mateusmacedo/dmpf-plugin` vem do
  GitHub Packages, que exige autenticação até para pacote público.

Para o dia a dia com o workspace, tenha também estas ferramentas de linha de comando:

- `git` — controle de versão do repositório.
- `node` — runtime dos scripts (já coberto pelo requisito de Node.js `^24`).
- `jq` — processamento de JSON em scripts e automações.
- `yq` (implementação do mikefarah) — processamento de YAML; confirme a origem
  com `yq --version`, cuja saída menciona `mikefarah/yq`.

O binário `gh` (GitHub CLI) é o caminho padrão para operar a plataforma: o
repositório vive no GitHub (`github.com/mateusmacedo/dmpf-nx-template`), e PRs,
runs e releases se operam por ele.

```bash
corepack enable
node --version
pnpm --version
git --version
jq --version
yq --version
```

## Instalação

O `.npmrc` versionado só aponta o escopo `@mateusmacedo` para o GitHub Packages; a
credencial fica no `.npmrc` do seu usuário, porque desde a 11.5.3 o pnpm ignora
`${VAR}` em credencial do `.npmrc` do projeto (GHSA-3qhv-2rgh-x77r):

```bash
echo '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}' >> ~/.npmrc
export NODE_AUTH_TOKEN=<token com read:packages>
pnpm install
```

Sem a credencial, o `pnpm install` falha com `ERR_PNPM_FETCH_401` em
`npm.pkg.github.com`.

O `pnpm install` também executa o script `prepare`, que instala o `lefthook`. O
script é tolerante a falha (`lefthook install || true`), então a instalação não
quebra em ambientes sem o binário — mas nesse caso os hooks locais não ficam
ativos.

As versões de dependências são centralizadas no `catalog:` do
`pnpm-workspace.yaml`. Cada `package.json` referencia `"catalog:"` em vez de fixar
a versão. O mesmo arquivo tem `allowBuilds`, a allowlist de scripts de
postinstall: pacotes marcados como `false` estão bloqueados de propósito.

## O que já existe no workspace

```bash
pnpm nx show projects
```

Hoje isso retorna apenas o metadado raiz:

| Projeto Nx | Caminho |
| --- | --- |
| `@nx-base-template/source` | raiz (metadado, sem código) |

O template não traz apps nem libs — `apps/*` e `libs/*` são diretórios de
destino. Os projetos aparecem aqui conforme você os cria.

## Criar a primeira app ou lib

Use os generators do Nx. O guia completo, com as flags e o que cada generator
cria, está em `docs/nx-reference/tasks.md`.

```bash
# lib compartilhada
pnpm nx g @nx/js:lib libs/shared/<name> \
  --importPath=@mateusmacedo/shared-<name> \
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
pnpm nx test @mateusmacedo/minha-lib
pnpm nx build @mateusmacedo/minha-lib
```

Para rodar um único arquivo de teste, o passthrough vai direto ao Jest 30 — a flag
é `--testPathPatterns`, no plural:

```bash
pnpm nx test @mateusmacedo/minha-lib --testPathPatterns="string"
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
- Pre-commit: `gofmt -l` nos `.go` em stage; reprova arquivo fora do padrão ou
  com erro de sintaxe.
- Pre-push: uma invocação de `pnpm nx affected -t lint,typecheck,test,build`,
  com `--parallel=3` e `--exclude=@nx-base-template/source`, com base no que o
  remoto já tem (`@{push}`, ou o merge-base com `origin/develop` na branch nova).

Se um hook alterar arquivos no pre-commit, revise o diff antes de concluir o
commit.

## CI

O workflow `.github/workflows/ci.yml` roda em PRs para `master`, `develop` e
`release/**`, no runner `ubuntu-26.04`. A pipeline executa `pnpm biome ci .` e
depois `nx affected` de lint, typecheck, test (com `--ci --coverage`), build e
e2e.

O job `Escopo` classifica o diff: num PR só de documentação (`docs/**` e `*.md`
fora de `tools/`, `.claude/` e `.agents/`), os jobs pesados são pulados e o job
`CI`, check obrigatório da `develop`, aprova sem rodá-los. A esteira completa por
etapa está em `docs/ci-cd/README.md`.

## Release e plataforma

- A plataforma é o **GitHub** (`github.com/mateusmacedo/dmpf-nx-template`) — ver
  `docs/adr/010-migracao-github-linear.md`.
- O versionamento (`nx-release.yml`) é separado da publicação de libs no GitHub
  Packages, que roda no job `publish` encadeado ao mesmo run. O
  `nx-publish-libs.yml` só republica, por disparo manual.
- O `create-release.yml` cria a branch `release/X.Y.Z` e avisa para abrir o PR
  para `master` com a sua conta depois do primeiro push com commits: as execuções
  disparadas pelo `GITHUB_TOKEN` terminam sem nenhum job.

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

## Sincronização com o tracker

O trabalho deste repositório é rastreado no Linear, no projeto
[nx-base-template](https://linear.app/mmda/project/nx-base-template-db3f16eab767)
(time DevTeam, chave `DEVS`). Projetos derivados escolhem o próprio tracker.

- **Uma spec, uma issue**, com o título `[SPEC-<id>] <título da spec>`. A spec
  continua sendo a fonte da verdade do escopo.
- **Vínculo:** o `ticket_url` do frontmatter guarda a URL da issue
  (`https://linear.app/mmda/issue/DEVS-<n>/...`); specs guarda-chuva listam as
  sub-issues em `subtask_urls`.
- **Status ↔ stage:** `backlog` e `deferred` → Backlog, `planning` → Todo,
  `building` → In Progress, `done` → Done, `cancelled` → Canceled.
- **Prioridade:** P0 → Urgent, P1 → High, P2 → Medium, P3 → Low.
- **Dependências:** o `depends_on` de cada spec vira relação *blocked by*.
- **Branch e PR:** `tipo/DEVS-<n>-descricao-curta` e título
  `tipo(scope): [DEVS-<n>] descrição`.

## Ao derivar deste template

Um repositório criado a partir deste template herda a identidade dele. Antes do
primeiro PR do derivado:

1. **Nome do pacote raiz.** `@nx-base-template/source` aparece no `package.json`,
   no `project.json`, no `lefthook.yml`, nos workflows (`ci.yml`, `nx-release.yml`,
   `nx-publish-libs.yml`, `publish-libs.yaml`, `dmpf-agendado.yml`), no
   `.github/PULL_REQUEST_TEMPLATE.md`, no `AGENTS.md`, neste guia e no
   `docs/guides/development-workflow.md`. Os ADRs citam o nome como registro
   histórico e ficam como estão. Para listar o que resta:

   ```bash
   git grep -l '@nx-base-template/source' -- ':!docs/adr' ':!docs/specs' ':!docs/analises'
   git grep -lw 'nx-base-template' -- ':!docs/adr' ':!docs/specs' ':!docs/analises'
   ```

2. **Identidade DMPF.** Rode o `init` com o prefixo de módulo e o projeto Compose
   do derivado (ver `docs/guides/primeiro-bounded-context.md`). O `init` reescreve
   o `name:` do `infra/test/compose.yml` (arquivo gerenciado), mas o do
   `infra/local/docker-compose.yml` (`nx-base-template-local`) é seed, que um
   `init` repetido não toca: troque à mão.
3. **Escopo npm.** Troque `@mateusmacedo` pelo owner do repositório no GitHub
   Packages, com o mesmo casing no `package.json`, no `tsconfig.base.json` e no
   input `scope` da publicação (ver o `AGENTS.md`).
4. **Tracker.** Troque a linha do projeto do Linear neste guia e no `AGENTS.md`.
5. **Nx Cloud.** O template sai com `neverConnectToCloud: true` no `nx.json`. Para
   conectar, remova a flag e rode `pnpm nx connect`.
6. **Rulesets.** Rulesets não são copiados para o repositório novo. Recrie os da
   `develop` e da `master` como o `AGENTS.md` descreve (seção "Git e release").
7. **ADRs.** Numere os ADRs do derivado a partir de `100`; a faixa `001-099` é do
   template (ver `docs/adr/README.md`).
8. **Inventário.** À medida que criar apps e libs, atualize a "Visão geral" do
   `AGENTS.md` (que diz que o template não tem nenhuma) e a árvore do `README.md`.

O job `Template smoke (DMPF)` do `ci.yml` só roda enquanto o `modulePrefix` do
`dmpf.json` for o reservado `example.com/change-me`. Depois do `init` do
derivado, o job fica inerte sem precisar editar o workflow.

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
