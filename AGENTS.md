# AGENTS.md

Guidance for agents working in this repository. `CLAUDE.md` na raiz aponta para este arquivo (`@AGENTS.md`).

Este arquivo guarda só o que é específico do repositório e não está em outro lugar. Conduta, escopo de alterações, glossário e níveis de regra estão em `.claude/rules/change-protocol.md`; git, refatoração e testes, em `.claude/rules/git-safety.md` e `testing-conventions.md`; padrões de código, em `code-patterns.md`. Em conflito, prevalecem os arquivos de configuração efetivos (`package.json`, `pnpm-workspace.yaml`, `nx.json`, `biome.json`, `lefthook.yml`, `tsconfig.base.json`). Respostas em PT-BR por default; código em inglês.

## Regras duras

- Nunca edite diretamente em `master` ou `develop`.
- Peça confirmação explícita antes de commit e push; revise o `git diff` antes do commit.
- Não desabilite hooks (`--no-verify`) nem faça force push ou operação Git destrutiva sem pedido explícito.
- Não modifique testes para passar — corrija o código sob teste.
- Ao terminar código, rode a cadeia de validação até passar (ver [Comandos](#comandos)).
- Ao documentar configurações, copie fielmente os valores reais em vez de generalizar.
- Antes de renomear ou mover símbolo ou arquivo, busque todos os usos e revise os imports, inclusive mocks e imports dinâmicos.

## Visão geral

`nx-base-template` (workspace npm `@nx-base-template/source`) é o baseline de monorepo **Nx + pnpm** multistack mantido por `mateusmacedo`. É um **template**: está preparado para Express, Fastify, NestJS, Next.js, Angular e Go (`go.work` / `@nx-go/nx-go`) e traz a saída do `init` do `@mateusmacedo/dmpf-plugin` para bounded contexts Go do DMPF (ADR-011), mas **não contém apps nem libs**. Fonte de verdade dos projetos: `pnpm nx show projects`. Estrutura de diretórios: `README.md`. Para derivar um projeto: seção "Ao derivar deste template" do `docs/onboarding.md`.

- **Autônomo:** specs (`docs/specs/`), regras de domínio (`docs/rules/**`, escopos `BIZ-`/`APP-`/`PRD-`), ADRs (`docs/adr/README.md`), rules e skills em `.claude/` são versionados aqui, sem plugin externo (a fronteira supersedida está na ADR-007).
- **Primeira app ou lib:** invoque a skill `nx-generate` antes de explorar. Lib compartilhada: `pnpm nx g @nx/js:lib libs/shared/<name>` com as três tags e `--linter=none` (passo a passo em `docs/nx-reference/tasks.md`). Primeiro bounded context Go: `docs/guides/primeiro-bounded-context.md`; o `go.work` declara `go 1.26.10`, sem módulos até lá.
- **Release sem libs:** sem projeto `type:lib`, o `nx release` sai com erro (`Release group "__default__" matches no projects`); o step `Detect lib release candidates` do `nx-release.yml` pula versão e push, e o pipeline fica ocioso, não vermelho.
- **Escopo npm:** `@mateusmacedo/`, em minúsculas; no GitHub Packages ele é o owner do repositório. O casing precisa bater entre o `name` de cada `package.json`, os `paths` do `tsconfig.base.json` e o input `scope` da publicação (`nx-release.yml` e `nx-publish-libs.yml`); divergência faz o `pnpm publish` cair no registry público.

## Tooling

- **Runtime:** Node.js `^24`; `pnpm@11.14.0` (`packageManager`). O CI não fixa a versão do pnpm: o `pnpm/action-setup` a infere, e passar as duas causa `ERR_PNPM_BAD_PM_VERSION`.
- **Dependências:** versões no `catalog:` do `pnpm-workspace.yaml`; cada `package.json` usa `"catalog:"`. O `allowBuilds` do mesmo arquivo é a allowlist de postinstall: `false` é bloqueio deliberado. Nx `23.1.0`; NestJS `11.1.28` pelo catalog.
- **DMPF:** `@mateusmacedo/dmpf-plugin` `1.0.0-rc.7` do GitHub Packages. O `.npmrc` versionado só aponta o escopo para o registry; a credencial fica no npmrc de usuário (`~/.npmrc`; no CI, `$RUNNER_TEMP/npmrc` + `NPM_CONFIG_USERCONFIG`), porque o pnpm 11.5.3+ ignora `${VAR}` no `.npmrc` do projeto. Arquivos DMPF são saída do `init` e só mudam por `nx migrate` (ADR-011); o Biome os exclui (`dmpf.json`, `dmpf.rendered.json`, `infra/`, `tools/dmpf-baseline/`). Versão recém-publicada do plugin entra no `minimumReleaseAgeExclude`.
- **Biome 2.4.16** (lint + format, não Prettier): 2 espaços, `lineWidth` 100, aspas simples, trailing commas `all`, semicolons e arrow parens sempre; `noUnusedVariables: error`, `noExplicitAny: warn`, `useImportType: error` (`import type` é obrigatório) e `unsafeParameterDecoratorsEnabled` para decorators de parâmetro do NestJS.
- **Testes:** Jest 30 com `@swc/jest` (`.spec.swcrc` com decorators e `keepClassNames`); o `jest.preset.js` tem `passWithNoTests: true`.
- **TypeScript:** `strict`, `module`/`moduleResolution: nodenext`, `target: es2022`, Project References (`composite`, `emitDeclarationOnly`). `paths` do `tsconfig.base.json` e `references` do `tsconfig.json` começam vazios: cada lib nova acrescenta a própria entrada nos dois.
- **Hooks (Lefthook):** instalados por `pnpm prepare` (`lefthook install || true`). `pre-commit`: `biome check --write` e `gofmt -l` nos arquivos em stage. `pre-push`: uma invocação de `nx affected -t lint,typecheck,test,build` contra o que o remoto já tem.

## Convenções obrigatórias

- **Tags 3D** em todo app/lib de produção, uma de `type:`, `scope:` e `stack:`; valores válidos na tabela canônica de `docs/nx-reference/tasks.md`. Projetos Go do `bounded-context` levam também uma `layer:`. Exceção: `@nx-base-template/source`. O publish npm cobre `tag:type:lib,!tag:stack:go`, em grupos que nascem com o primeiro membro.
- **Não redeclarar targets** que um plugin ou os `targetDefaults` já fornecem — quebra o cache silenciosamente (ADR-002).
- **Commits:** Conventional Commits em PT-BR, `<tipo>(<scope>): <descrição imperativa>`, até 72 caracteres no assunto. `scope` é o nome do projeto Nx sem o prefixo npm; projetos distintos vão em commits separados. Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `ci`. Detalhes na skill `.agents/skills/nx-commit/`.

## Comandos

Sempre `pnpm nx`, nunca o `nx` global. O root `@nx-base-template/source` só tem targets `nx:noop`: exclua-o de operações em lote.

```bash
# Cadeia de validação
pnpm biome check --write .
pnpm nx affected -t lint,typecheck,test,build --exclude=@nx-base-template/source

pnpm nx run-many -t test --exclude=@nx-base-template/source   # todos os projetos
pnpm nx test @mateusmacedo/minha-lib --testPathPatterns="string"  # um arquivo de teste
pnpm biome ci .                                                # checagem do CI
node tools/adr-verify.mjs --to 99 --check a1,a2,a3,a6,a7,a8    # acervo de ADRs
pnpm nx graph
```

Scripts raiz (`pnpm lint`, `typecheck`, `test`, `build`, `format`, `format:check`) existem; para tasks Nx prefira `pnpm nx`.

## Git e release

- **Plataforma:** GitHub (`github.com/mateusmacedo/dmpf-nx-template`, repositório template), via `gh` (ADR-010, que supersede a ADR-005).
- **Tracker:** projeto [nx-base-template](https://linear.app/mmda/project/nx-base-template-db3f16eab767) no Linear (time DevTeam, chave `DEVS`). Cada spec tem uma issue, ligada pelo `ticket_url`; branch e título de PR levam `DEVS-<n>`. Sincronização: `docs/onboarding.md`.
- **Branches protegidas:** rulesets do GitHub. `develop` ("CI obrigatório na develop") exige PR, sem aprovação mínima, e o check `CI` verde, sem deleção e sem force push. `master` ("Proteção da master") fica sem deleção e sem force push, sem bypass: o commit de versão e as tags que o GitHub Actions empurra nela são fast-forward, e repositório de usuário não aceita a integração do Actions como bypass. `defaultBase` do Nx é `master`.
- **Fluxo (git-flow):** trabalho → `develop` → `release/X.Y.Z` → `master`. PRs de feature comparam contra `origin/develop`. Antes do PR para `develop`, a branch de trabalho mergeia `release/X.Y.Z`. **Anti-drift (duro):** a promoção para `release` usa a mesma árvore já mergeada em `develop`; promoção paralela com conteúdo diferente reabre os conflitos. Detalhe em `CONTRIBUTING.md`.
- **Release:** Nx Release independente por projeto, por Conventional Commits, tag `{projectName}@{version}`; o `nx.json` não declara grupos (eles nascem com o primeiro membro; ver `docs/nx-reference/tasks.md`). `create-release.yml` cria `release/X.Y.Z` a partir de `master` (abra o PR com a sua conta: execuções disparadas pelo `GITHUB_TOKEN` não rodam jobs). `nx-release.yml` roda no merge de `release/*` ou `hotfix/*` em `master`: versiona, empurra commit e tags, faz o release Docker no `ghcr.io` quando há `type:app` fora de Go e encadeia o `publish-libs.yaml` (GitHub Packages, só `GITHUB_TOKEN`). Pré-release `release/X.Y.Z-<pre>` publica com a dist-tag `next`. `nx-publish-libs.yml` é a republicação manual (inputs `tag` e `ref`). Detalhe em `CONTRIBUTING.md`; consumo das libs em `docs/ci-cd/README.md` (ADR-004, ADR-010).
- **CI:** `ci.yml` roda em PRs para `master`, `develop` e `release/**` (`ubuntu-26.04`). O job `Escopo` classifica o diff: PR só de documentação pula os jobs pesados; o `ADR` roda quando o diff toca `docs/adr/` ou o verificador; o `Template smoke (DMPF)`, só com o `modulePrefix` reservado; o job `CI` agrega tudo e é o check obrigatório. Projetos Go passam pelo `dmpf-ci.yml` (saída do `init`), fora dos obrigatórios no template (addendum da ADR-011). Esteira completa por etapa: `docs/ci-cd/README.md`.
- **CD:** `cd-dev-hmg.yml` é template desligado; o `deploy-eks.yaml` que ele cita não existe e nasce no projeto que ligar o CD (`docs/ci-cd/`).

## Orquestração

- Scaffolding de apps e libs: skill `nx-generate` antes de explorar ou gerar.
- Navegação do workspace: skill `nx-workspace`. Commits: skill `nx-commit`.
- Código Go: sempre o agente `golang-pro` (`.claude/agents/golang-pro.md`).
- Agentes e skills de domínio: `.claude/README.md`; skills de workspace: `.agents/skills/`.

## Referências

- `CONTRIBUTING.md` — fluxo de contribuição, release e anti-drift.
- `docs/onboarding.md` — setup local, primeiro PR, derivação e tracker.
- `docs/adr/README.md` — índice, template, faixas de numeração e verificador de ADRs.
- `docs/nx-reference/tasks.md` — configuração de tasks e taxonomia de tags.
- `docs/guides/development-workflow.md` — guia detalhado do fluxo.
- `docs/guides/primeiro-bounded-context.md` — do template ao primeiro bounded context verde.
- `docs/specs/README.md` e `docs/rules/README.md` — catálogo de specs e regras de domínio.
- `docs/ci-cd/` — CI/CD e deploy; `infra/docker/Dockerfile.node.example` — Dockerfile de referência.
- `README.md` — visão do monorepo e estrutura de diretórios.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
