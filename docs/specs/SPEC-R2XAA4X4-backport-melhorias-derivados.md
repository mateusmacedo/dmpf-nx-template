---
id: SPEC-R2XAA4X4
slug: backport-melhorias-derivados
title: Backport das melhorias dos projetos derivados para o template
stage: building
priority: P1
depends_on: [SPEC-TXJ6A4XX]
ticket_url: https://linear.app/mmda/issue/DEVS-165/spec-r2xaa4x4-backport-das-melhorias-dos-projetos-derivados-para-o
subtask_urls: [https://linear.app/mmda/issue/DEVS-166/spec-r2xaa4x4-onda-0-decisoes-e-pre-requisitos-bkp-01-bkp-02-parte-1, https://linear.app/mmda/issue/DEVS-167/spec-r2xaa4x4-onda-1-correcoes-de-baixo-risco-bkp-05-a-bkp-13, https://linear.app/mmda/issue/DEVS-168/spec-r2xaa4x4-onda-2-bump-do-dmpf-rc3-rc7-bkp-14-04-15-16-17, https://linear.app/mmda/issue/DEVS-169/spec-r2xaa4x4-onda-3-cicd-estrutural-bkp-18-a-bkp-26-bkp-02-parte-2, https://linear.app/mmda/issue/DEVS-170/spec-r2xaa4x4-onda-4-derivacao-e-governanca-bkp-28-a-bkp-32]
created: 2026-10-30
---

# SPEC-R2XAA4X4: Backport das melhorias dos projetos derivados para o template

## Resumo

Trazer para o `nx-base-template` as melhorias genéricas que o marketplace, o
antecipa-market e a lidercap-platform fizeram depois de partir do template (ou
em paralelo a ele): o bump do `@mateusmacedo/dmpf-plugin` de `1.0.0-rc.3` para
`1.0.0-rc.7`, a correção de defeitos latentes, o endurecimento do CI/CD e a
redução do atrito de derivação. Como mantenedor do template, quero que o
próximo derivado nasça com essas correções, sem repetir à mão o que três
projetos já resolveram.

Esta é uma spec guarda-chuva: cinco ondas, cada uma com uma sub-issue no
Linear, uma branch, um plano e um PR para `develop`.

## Contexto

- **Problema**:
  - O template está em `980c3aa` (2026-10-10) e fixa o plugin na `rc.3`
    (`pnpm-workspace.yaml:27,66`). Os dois derivados já estão na `rc.7`, que
    traz Keycloak de referência, Redis com ACL, Go `1.26.10`,
    `golangci-lint` `v2.15.0` e ativos de IA novos.
  - Os derivados expuseram defeitos latentes no template, confirmados em
    2026-10-30:
    - `.gitignore:64` (`.env.*`) ignora o `deploy/.env.migrator.example` que a
      `rc.7` gera;
    - o `@nx/docker` declara só o nome do `docker:build` (`nx.json:63-70`) e
      roda com `cwd = projectRoot`, contra o `Dockerfile.node.example`, que
      exige o contexto na raiz;
    - o `monitor-ci` documenta `--timeout 120` em minutos
      (`.agents/skills/monitor-ci/SKILL.md:27`), mas passa o valor ao script
      como segundos (linha 183);
    - o `detect-apps.yaml:73` devolve sempre `[]` no layout
      `apps/backend/<app>`;
    - o Renovate abre PR na `master` (`renovate.json:4`), contra o git-flow;
    - a publicação usa sempre `tag: latest` (`nx-release.yml:184`);
    - o `!**/.claude` do Biome (`biome.json:50`) zera o check dentro de um
      worktree em `.claude/worktrees/`.
  - A governança documentada não existe: o `AGENTS.md:224` descreve rulesets
    em `master` e `develop`, mas a API do GitHub devolveu `[]` para os
    rulesets e `404 Branch not protected` para as duas branches.
  - Derivar tem atrito previsível: o nome do pacote raiz aparece em 13
    arquivos, o `nxCloudId` (`nx.json:159`) é herdado por todo derivado, o
    `template-smoke` sempre falha fora do `modulePrefix` reservado e a
    numeração de ADR colide (os dois derivados já usam `012+`).
  - O working tree de `develop` tem WIP: 45 arquivos de `.claude/` com
    `model: opus` (51 na análise; 6 voltaram a `model: sonnet` depois), o
    `tsconfig.base.json` apagado e o `apps/backend/playground/` não
    rastreado.
- **Impacto**: um derivado criado depois desta spec herda o DMPF atual, um CI
  que não trava PR de documentação, release com pré-release correta e um
  roteiro de derivação sem passos descobertos por tentativa e erro.
- **Inspiração**: os próprios derivados. Cada requisito tem a origem
  (`MKT-*`, `ANT-*`, `PLT-*`) e os commits nos anexos da análise.
- **Links relevantes**:
  - Análise consolidada:
    [`ANALISE-BACKPORT-DERIVADOS.md`](../analises/backport-derivados/ANALISE-BACKPORT-DERIVADOS.md)
    (matriz BKP-01 a BKP-33, evidências e ordem sugerida, versão de
    2026-10-30).
  - Anexos por repositório, em `docs/analises/backport-derivados/`:
    [`marketplace`](../analises/backport-derivados/ANALISE-BACKPORT-DERIVADOS-anexo-marketplace.md),
    [`antecipa-market`](../analises/backport-derivados/ANALISE-BACKPORT-DERIVADOS-anexo-antecipa-market.md) e
    [`lidercap-platform`](../analises/backport-derivados/ANALISE-BACKPORT-DERIVADOS-anexo-lidercap-platform.md).
  - SPEC-TXJ6A4XX: template greenfield DMPF, que fixou a `rc.3`.
  - SPEC-317RXZ73: migração para GitHub, GitHub Packages e Linear.
  - `docs/adr/011-template-consome-dmpf-por-versao.md` (arquivos DMPF só
    mudam por `nx migrate`) e `docs/adr/002-nx-task-configuration.md`.
  - `docs/guides/primeiro-bounded-context.md`, `docs/ci-cd/README.md`,
    `docs/onboarding.md` e `CONTRIBUTING.md`.

<constraints>
- [P0] Arquivo listado no `dmpf.rendered.json` muda só por `nx migrate`. Copiar arquivo DMPF de um derivado é proibido (ADR-011).
- [P0] Itens classe D ficam fora: código de domínio, parâmetros do `init` de cada derivado e código do kernel, do plugin e do conformance da plataforma.
- [P0] Não regredir onde o template está à frente: credencial no `.npmrc` de usuário e input `install` do composite `setup-node-pnpm`; inputs por `env` no `publish-libs.yaml`; `fetchRetries` e `fetchRetryMintimeout` no `pnpm-workspace.yaml`; `docs/ci-cd/` sem dependência do `actions-templates`; `nx-publish-libs.yml`.
- [P0] Criar ruleset, secret ou variável no GitHub exige autorização explícita do usuário no momento da execução.
- [P0] Cada onda termina verde: `pnpm biome ci .`, `pnpm nx affected -t lint,typecheck,test,build --exclude=@nx-base-template/source` e `bash tools/template-smoke.sh`.
- [P1] Nenhum `.env.*.example` versionado contém segredo real.
- [P1] Um commit por BKP, em Conventional Commits PT-BR com scope `workspace` e a chave `DEVS-<n>` da sub-issue da onda. Ondas não se misturam num PR.
- [P1] Patch local em ativo que vem de upstream (Nx, DMPF) é acompanhado do registro do defeito upstream.
</constraints>

## Requisitos

### Funcionais

#### Onda 0 — decisões e pré-requisitos

- [x] **[P0] BKP-01 Consolidar o WIP de agents e skills**: commitar só os 45
  arquivos de `.claude/agents/` e `.claude/skills/` (`model: opus` e
  `skills:` do `golang-pro`) num commit isolado.
  - Os 6 arquivos que voltaram a `model: sonnet` ficam como estão:
    `agent-organizer`, `change-impact-analysis`, `context-manager`,
    `knowledge-synthesizer`, `readme-generator` e
    `skill-change-impact-analysis`.
  - Restaurar o `tsconfig.base.json` com `git restore` (decisão D1).
  - Deixar o `apps/backend/playground/` fora do commit (decisão D1).
- [x] **[P0] BKP-02 Rulesets (parte 1)**: reescrever o `AGENTS.md:224` para
  descrever o estado real, sem ruleset, e registrar que os rulesets nascem
  com o BKP-20 (decisão D2).
- [x] **[P0] BKP-03 Nx Cloud**: trocar o `nxCloudId` do `nx.json` por
  `"neverConnectToCloud": true` (decisão D3).
  - O `ci.yml` passa `NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}`
    no `env`, inerte no template.
  - O passo do derivado entra no BKP-28: remover o `neverConnectToCloud` do
    `nx.json`, depois `pnpm nx connect`, `pnpm biome format --write nx.json`
    e o secret. Com a flag, o Nx 23.1.0 ignora `nxCloudId` e token
    (`isNxCloudDisabled` em `nx/dist/src/utils/nx-cloud-utils.js`).

#### Onda 1 — correções de baixo risco

- [x] **[P1] BKP-05 Ignorar artefatos locais**: `graphify-out/` e `.obsidian/`
  no `.gitignore`, `!.obsidian` no `biome.json` (junto do BKP-06) e
  `golang.go` no `.vscode/extensions.json`.
- [x] **[P0] BKP-06 Biome**: acrescentar
  `"vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true }`.
  - Ancorar na raiz as negações de diretórios-raiz (`!.claude`, `!.agents`,
    `!.nx`, `!plans`, `!tmp`, `!.remember`, `!.cursor`, `!.gemini`,
    `!.opencode`, `!.tokensave`, `!.github/skills`, `!.github/prompts`).
  - Manter `**/` só em `dist`, `out-tsc`, `test-output`, `coverage`,
    `node_modules`, `pnpm-lock.yaml` e `*.swcrc`. Manter as quatro exclusões
    DMPF.
- [x] **[P1] BKP-07 `.nxignore`**: criar o arquivo com `**/testdata/**`.
- [x] **[P0] BKP-08 `monitor-ci`**: aplicar em `.agents/skills/monitor-ci/` e
  `.github/skills/monitor-ci/` a conversão `* 60` do timeout.
  - Acrescentar `--elapsed-seconds` entre tentativas, o retorno
    `limitReached` e o `Number.parseInt`.
- [x] **[P0] BKP-09 Renovate**: `baseBranchPatterns: ["develop"]`,
  `:enableVulnerabilityAlerts` e `osvVulnerabilityAlerts: true`.
  - `ignorePaths` para `**/testdata/**`, `**/__fixtures__/**` e
    `**/examples/**`.
  - Duas regras gomod: a dependência `indirect` é consultada, mas só o alerta
    de vulnerabilidade a sobe.
  - Manter as regras que desligam o plugin DMPF, o `@nx-go/nx-go` e o
    `mateusmacedo/dmpf`.
- [x] **[P0] BKP-10 `nx-release.yml`**: `LEFTHOOK: "0"` no job `version`.
  - Usar `pnpm --silent nx show projects ... --json` nas linhas 91 e 141.
  - Acrescentar o input `version` no `workflow_dispatch`, validado pela regex
    semver `^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$`.
- [x] **[P1] BKP-11 Lefthook**: o pre-push roda uma única invocação de
  `nx affected -t lint,typecheck,test,build`.
  - A base é `@{push}` ou, na falta dele, `git merge-base HEAD origin/develop`.
  - O pre-commit roda `gofmt -l` só nos `.go` em stage e reprova quando a
    saída não é vazia ou quando o status é diferente de zero.
- [x] **[P1] BKP-12 Skills Go**: trocar `RunContainer`/`WithImage` pela API
  `Run` e por `testcontainers.CleanupContainer` em
  `.claude/skills/skill-go-testing/SKILL.md` e
  `.claude/skills/skill-unit-integration-testing/SKILL.md`.
- [x] **[P2] BKP-13 PR de release pelo `GITHUB_TOKEN`**: corrigir o
  `::notice::` do `create-release.yml`, o `CONTRIBUTING.md` e o
  `docs/guides/development-workflow.md`.
  - O texto correto é: o GitHub encerra sem jobs as execuções disparadas pelo
    `GITHUB_TOKEN`.
  - Orientar a abrir o PR depois do primeiro push com commits.

#### Onda 2 — bump do DMPF `rc.3` → `rc.7`

- [x] **[P0] BKP-14 `nx migrate`**: rodar
  `pnpm nx migrate @mateusmacedo/dmpf-plugin@1.0.0-rc.7`, `pnpm install` e
  `pnpm nx migrate --run-migrations`, sem `--force`.
  - O diff fica restrito a: arquivos do `dmpf.rendered.json` (13 novos e 19
    alterados), pins do catalog e do `minimumReleaseAgeExclude`, `go.work`
    `1.26.10`, `golangci-lint` `v2.15.0` no `nx.json` e `workflowRef`
    `ddd3d0c` no `dmpf-ci.yml`.
- [x] **[P0] BKP-04 `.env.*.example`**: acrescentar `!.env.*.example` logo
  depois de `!.env.example`, no mesmo PR do BKP-14, depois de conferir que
  nenhum `.env.*.example` carrega segredo.
- [x] **[P0] BKP-15 Passos manuais do bump**:
  - acrescentar `- compose/keycloak.yml` ao `include` de
    `infra/local/docker-compose.yml`, depois do `swagger-ui.yml`;
  - rodar `go run github.com/mateusmacedo/dmpf/tools/dmpf-conformance/cmd/infrasync@v1.0.0-rc.7 --root . --write`
    e revisar o diff antes de commitar;
  - trocar as versões escritas à mão em `AGENTS.md` (`rc.3` e `go 1.26.9`),
    `README.md`, `docs/onboarding.md` e
    `docs/guides/primeiro-bounded-context.md` (`5def4d2` → `ddd3d0c`).
    A ADR-011 e a SPEC-TXJ6A4XX ficam como histórico.
- [x] **[P1] BKP-16 Premissa do `dmpf-ci.yml` vermelho**: abrir o PR da onda
  como draft e observar o check `DMPF / DMPF`.
  - Reescrever os trechos de `AGENTS.md` (seção CI), `README.md` e
    `docs/ci-cd/README.md` conforme o resultado observado.
  - Registrar o resultado num addendum da ADR-011.
- [x] **[P1] BKP-17 Docs DMPF/Go**:
  - `primeiro-bounded-context.md`: dar `git add` no contexto antes do gate;
  - `docs/specs/README.md`: seção "Specs de bounded context", com o template
    da skill `dmpf-bounded-context` e `/dmpf-new-context SPEC-<id>`;
  - `docs/nx-reference/tasks.md`: `--skipFormat` no
    `@nx-go/nx-go:library` e repetição de `dependsOn` e `cache` no default
    por executor;
  - nota "Override DMPF" nas skills `skill-go*` e nas rules
    `file-organization` e `testing-conventions`;
  - `AGENTS.md`: código Go sempre pelo agente `golang-pro`.

#### Onda 3 — CI/CD estrutural

- [x] **[P1] BKP-18 Actions**: fixar por SHA, com o comentário da versão,
  toda action de `ci.yml`, `create-release.yml`, `nx-release.yml`,
  `publish-libs.yaml`, `detect-apps.yaml` e do composite `setup-node-pnpm`.
  - Preferir actions com `runs.using: node24`.
  - Usar `permissions: {}` no topo e permissões por job; o job `main` tem
    `packages: read`.
- [x] **[P0] BKP-19 `@nx/docker`**: usar
  `"buildTarget": { "name": "docker:build", "cwd": ".", "args": ["-f {projectRoot}/Dockerfile"] }`
  com os `--secret` `id=npmrc` e `id=NODE_AUTH_TOKEN` que o Dockerfile de
  referência pede. Não copiar o `runTarget` da plataforma.
- [x] **[P0] BKP-20 Escopo e check agregador**: remover o `paths-ignore` do
  `ci.yml`.
  - O job `Escopo` classifica o diff. Contam como documentação `docs/**` e
    `*.md` fora de `tools/`, `.claude/` e `.agents/`.
  - `main` e `template-smoke` rodam só com `code == 'true'`.
  - O job `CI` tem `needs` de todos e `if: always()`, e reprova se algum
    resultado não for `success` nem `skipped`.
  - Declarar `CI: "true"` no `env`.
  - **BKP-02 (parte 2)**: com autorização, criar os rulesets de `develop`
    (PR obrigatório, check `CI`, sem deleção e sem force push) e de `master`
    (sem deleção e sem force push, com bypass do bot de release). Alinhar o
    `AGENTS.md`.
- [x] **[P1] BKP-21 Semente de cache**: criar `.github/workflows/cache-seed.yml`.
  - Gatilhos: `push` em `develop` e `master` filtrado por `pnpm-lock.yaml`,
    `pnpm-workspace.yaml` e `package.json`, `schedule` semanal e
    `workflow_dispatch`.
  - Passo único com o composite `setup-node-pnpm`.
- [x] **[P1] BKP-22 `detect-apps` pelo grafo**: usar
  `pnpm --silent nx show projects --affected --type app --json` após
  `nrwl/nx-set-shas` (`main-branch-name: ${{ github.ref_name }}`), filtrando
  pelo `marker_file`.
  - O job tem `packages: read`, `actions: read` e o `NODE_AUTH_TOKEN`.
  - O exemplo do `cd-dev-hmg.yml` usa
    `contains(fromJSON(needs.detect.outputs.apps || '[]'), 'apps/backend/<app>')`.
  - Atualizar o `docs/ci-cd/DEPLOY_APPLICATIONS.md`.
- [x] **[P1] BKP-23 `namedInputs`**: no `default`, excluir só
  `!{projectRoot}/**/CHANGELOG.md`. No `go`, excluir
  `!{projectRoot}/**/*.md`, `!{projectRoot}/package.json` e
  `!{projectRoot}/Dockerfile`.
- [x] **[P1] BKP-24 Pré-release**: quando o head do PR casar
  `^release/([0-9]+\.[0-9]+\.[0-9]+-[0-9A-Za-z.-]+)$`, rodar
  `nx release <versão>` explícito.
  - O output `dist_tag` é `next` quando alguma versão tiver `-` e `latest`
    nos demais casos, e o job `publish` o usa.
  - Combinar com o input `version` do BKP-10 e documentar a pré-release no
    `CONTRIBUTING.md`.
- [x] **[P1] BKP-25 Gates agendados**: workflow semanal de gates DMPF que
  termina com sucesso, sem rodar gate, quando não existe `go.mod` no
  workspace.
- [x] **[P2] BKP-26 Esteira de CI por etapa**: tabela no
  `docs/ci-cd/README.md` cobrindo `pre-commit`, `pre-push`, PR para
  `develop` e `release/**`, PR só de documentação, PR para `master`, `push`
  em `master`, agendado e semente de cache.
  - Alinhar `CONTRIBUTING.md`, `docs/onboarding.md` e
    `docs/guides/development-workflow.md`.

#### Onda 4 — derivação e governança

- [ ] **[P0] BKP-28 Roteiro de derivação**: seção "Ao derivar deste template"
  no `docs/onboarding.md`, cobrindo:
  - os 13 arquivos com o nome do pacote raiz;
  - o `name:` do compose seed e a linha do tracker;
  - o Nx Cloud (BKP-03: remover o `neverConnectToCloud` antes do
    `pnpm nx connect`), os rulesets (BKP-02) e a faixa de ADR (BKP-29).
  - O job `template-smoke` roda só quando `jq -r .modulePrefix dmpf.json`
    devolver `example.com/change-me`.
- [ ] **[P1] BKP-29 ADR**: a convenção do `docs/adr/README.md` reserva
  `001-099` ao template; o derivado começa em `100` (decisão D4).
  - Portar o `tools/adr-verify.mjs` da plataforma com os testes de
    `tools/tests/adr-verify/`, sem o cabeçalho que cita a spec de origem.
  - Adotar com `--from` e ligar no CI pelo escopo do BKP-20.
- [ ] **[P1] BKP-30 `AGENTS.md` enxuto**: deixar o arquivo com no máximo 150
  linhas fora do bloco Nx autoatualizado.
  - Toda regra removida passa a existir em `.claude/rules/` ou num
    `README.md`.
- [ ] **[P1] BKP-31 Rules de IA**:
  - criar `.claude/rules/language-review.md` (revisão PT-BR e EN uma vez,
    opcional, antes do PR);
  - dar `skills:` e as ferramentas `Skill`, `AskUserQuestion`, `Bash`, `LSP`,
    `Task`, `WebFetch` e `WebSearch` ao `agent-organizer`;
  - remover as seções "Reutilização" e "Go: processo e cadeia de validação"
    do `process-enforcement.md`;
  - manter o `comment-discipline.md` atual (decisão D5).
- [ ] **[P2] BKP-32 `.claude/settings.json`**: acrescentar ao
  `permissions.allow` o subconjunto read-only (`Bash(pnpm biome ci *)`,
  `Bash(gofmt -l *)`, `Bash(go vet ./...)`, `Bash(go version)`,
  `Bash(go doc *)` e `Bash(docker compose ls *)`).
  - Remover o `nx@nx-claude-plugins` do `enabledPlugins` só se ele duplicar
    as skills de `.agents/skills/` (decisão D6).

### Não-funcionais

- [ ] Compatibilidade: Node `^24`, `pnpm@11.14.0`, Nx `23.1.0`; Go `1.26.10`
  e `golangci-lint` `v2.15.0` depois da Onda 2.
- [ ] Segurança: nenhuma action por tag móvel depois do BKP-18; nenhum
  `${{ inputs.* }}` interpolado dentro de `run`; `pnpm config get *` fora do
  allowlist, porque pode imprimir token de registry.
- [ ] Desempenho: o pre-push faz 1 cálculo do grafo affected em vez de 4.
- [ ] Rastreabilidade: o corpo de cada commit cita o `BKP-NN` que implementa.

### Pontos a verificar na implementação

- O `template-smoke` e o `dmpf-ci.yml` nunca rodaram contra a `rc.7` sem
  módulo Go: o BKP-14 foi previsto pelo render dos templates.
- O efeito do `infrasync --write` com zero apps só foi observado no
  marketplace (+16 e +34 linhas).
- O advisory GO-2026-6809, citado como motivo do Go `1.26.10`, não foi
  conferido na fonte. Conferir antes de citá-lo em commit ou doc.
- `MCPSearch` só entra nas ferramentas do `agent-organizer` se existir no
  ambiente.

## Camadas afetadas

| Camada | Afetada? | Descrição |
| --- | --- | --- |
| Configs raiz (`nx.json`, `biome.json`, `.gitignore`, `lefthook.yml`, `renovate.json`, `.nxignore`) | [x] | Ondas 0, 1 e 3 |
| CI/CD (`.github/workflows/`, `.github/actions/`) | [x] | Ondas 1 e 3 |
| Saída do DMPF (`infra/`, `.agents/skills/dmpf-*`, `.claude/*/dmpf-*`, `.golangci.yml`, `go.work`) | [x] | Onda 2, só via `nx migrate` e `infrasync` |
| Ativos de IA (`.claude/`, `.agents/skills/monitor-ci/`) | [x] | Ondas 0, 1 e 4 |
| Docs (`AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `docs/`) | [x] | Todas as ondas |
| Ferramentas (`tools/`) | [x] | Onda 4 (`adr-verify.mjs`) |
| Apps e libs | [ ] | O template não tem projetos |

## Localização de código

```text
nx-base-template/
  .github/workflows/      — ci, create-release, nx-release, publish-libs, detect-apps, cd-dev-hmg, cache-seed (novo), gates agendados (novo)
  .github/actions/        — composite setup-node-pnpm (pins por SHA)
  .agents/skills/         — monitor-ci (patch) e dmpf-* (via migrate)
  .github/skills/         — monitor-ci (patch)
  .claude/                — agents, skills, rules, settings.json
  docs/                   — adr, specs/README, ci-cd, guides, nx-reference, onboarding
  infra/                  — saída do DMPF (migrate e infrasync); compose seed (include manual)
  tools/                  — adr-verify.mjs e tests/adr-verify/ (novos)
```

**Arquivos a modificar por onda**:

- Onda 0: `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`,
  `tsconfig.base.json` (restaurar), `AGENTS.md`, `nx.json`,
  `.github/workflows/ci.yml`.
- Onda 1: `.gitignore`, `biome.json`, `.vscode/extensions.json`,
  `.nxignore`, `.agents/skills/monitor-ci/**`, `.github/skills/monitor-ci/**`,
  `renovate.json`, `.github/workflows/nx-release.yml`, `lefthook.yml`, as duas
  skills de teste, `.github/workflows/create-release.yml`, `CONTRIBUTING.md` e
  `docs/guides/development-workflow.md`.
- Onda 2: saída do `nx migrate` e do `infrasync`, `.gitignore`,
  `infra/local/docker-compose.yml`, `AGENTS.md`, `README.md`,
  `docs/onboarding.md`, `docs/guides/primeiro-bounded-context.md`,
  `docs/ci-cd/README.md`, `docs/adr/011-template-consome-dmpf-por-versao.md`,
  `docs/specs/README.md`, `docs/nx-reference/tasks.md`,
  `.claude/skills/skill-go*/SKILL.md` e as rules `file-organization` e
  `testing-conventions`.
- Onda 3: workflows e composite citados, `nx.json`,
  `docs/ci-cd/README.md`, `docs/ci-cd/DEPLOY_APPLICATIONS.md`,
  `CONTRIBUTING.md`, `docs/onboarding.md`,
  `docs/guides/development-workflow.md` e `AGENTS.md`.
- Onda 4: `docs/onboarding.md`, `.github/workflows/ci.yml`,
  `docs/adr/README.md`, `tools/adr-verify.mjs`, `tools/tests/adr-verify/**`,
  `AGENTS.md`, `.claude/rules/*.md`, `.claude/agents/agent-organizer.md` e
  `.claude/settings.json`.

## Design

### Arquitetura

```text
Onda 0 (decisões, WIP, Nx Cloud) ──┬─> Onda 1 (correções pequenas e independentes)
                                   ├─> Onda 2 (BKP-14 + 04 + 15 → 16 draft → 17)
                                   ├─> Onda 3 (18, 19, 21, 22, 23, 24, 25 → 20 + rulesets → 26)
                                   └─> Onda 4 (28, 29, 31, 32; 30 depois do 02; 29 liga no CI do 20)
```

As ondas 1 e 2 são independentes entre si. A Onda 3 depende da D2 (Onda 0).
Na Onda 4, o BKP-28 depende do BKP-03 e o BKP-29 depende do job `Escopo` da
Onda 3.

### Fluxo principal (por onda)

1. Criar a branch de trabalho a partir de `develop`, com a chave da sub-issue
   (ex.: `chore/DEVS-<n>-backport-onda-1`).
2. Implementar os BKPs da onda, um commit por BKP.
3. Rodar a validação da constraint P0 e, na onda que toca a release, os
   cenários de teste correspondentes.
4. Abrir o PR para `develop` (draft na Onda 2, por causa do BKP-16).
5. Depois do merge, marcar os requisitos da onda e atualizar a sub-issue.

### Pseudocódigo

```text
# BKP-20: job agregador
CI:
  needs: [escopo, main, template-smoke, ...]
  if: always()
  run: echo "$NEEDS_JSON" | jq -e 'all(.[]; .result == "success" or .result == "skipped")'

# BKP-24: dist-tag
dist_tag = "next" se alguma versão liberada contém "-" senão "latest"

# BKP-28: template-smoke só no próprio template
se jq -r .modulePrefix dmpf.json == "example.com/change-me": rodar smoke
senão: pular com notice
```

## Decisões técnicas

- **Guarda-chuva com uma sub-issue por onda**: escolha do usuário. A
  rastreabilidade fica num só documento.
  Alternativa descartada: uma spec por onda, porque fragmentaria o histórico
  de decisões compartilhadas (D2, D3).
- **D1: restaurar o `tsconfig.base.json` e deixar o `playground` fora**: o
  `tsconfig.json` raiz tem `"extends": "./tsconfig.base.json"`, então a
  remoção quebra o typecheck de qualquer projeto TS. O
  `apps/backend/playground/` é um módulo Go sem projeto Nx, criado em
  2026-10-17.
  Alternativa descartada: commitar a remoção, porque nenhum derivado a fez e
  o `AGENTS.md` descreve o arquivo.
- **D2: corrigir o texto agora e criar os rulesets com o BKP-20**: criar o
  ruleset antes do check `CI` travaria todo PR só de documentação por causa
  do `paths-ignore`.
  Alternativa descartada: criar os rulesets na Onda 0, pelo mesmo motivo.
- **D3: `neverConnectToCloud: true` no template**: o derivado deixa de
  compartilhar o workspace do Nx Cloud do template e se conecta de forma
  explícita.
  Alternativa descartada: manter o `nxCloudId` e documentar a troca, porque
  o derivado que esquece o passo continua no workspace do template. Custo: o
  self-healing do `monitor-ci` só funciona no derivado conectado.
- **D4: faixa `001-099` para o template e `100+` para o derivado**: os
  derivados atuais (`012+`) só colidem com ADRs futuras do template, que
  ficam abaixo de `100`.
  Alternativa descartada: prefixo por projeto, porque quebraria a regra A3
  (numeração contínua) do `adr-verify.mjs`.
- **D5: manter o `comment-discipline.md` atual**: a versão "zero
  comentários" da plataforma é opinativa e o template não tem código onde
  aplicá-la.
- **D6: remover o `nx@nx-claude-plugins` só se duplicar**: o motivo da
  remoção no marketplace (`80a64c5`) não está registrado.
- **BKP-04 no PR do bump**: a regra do `.gitignore` só passa a ter efeito
  quando a `rc.7` gera `deploy/.env.migrator.example`.

## Regras relacionadas

- `AGENTS.md`: regras duras, convenções obrigatórias e fluxo git-flow.
- `CONTRIBUTING.md`: modelo anti-drift na promoção para `release/X.Y.Z`.
- `.claude/rules/git-safety.md` e `.claude/rules/process-enforcement.md`.
- ADR-011 (DMPF por versão), ADR-010 (GitHub e Linear), ADR-002 (tasks Nx).
- SPEC-TXJ6A4XX: origem da `rc.3` e do `template-smoke`.

## Verificação e testes

### Critérios de aceite

- [x] Onda 0: `git status` de `develop` sem os 45 arquivos de `.claude/` em
  WIP, `tsconfig.base.json` restaurado, `nx.json` sem `nxCloudId` e
  `AGENTS.md` sem afirmar ruleset inexistente.
- [x] Onda 1: `pnpm biome ci .` num worktree em `.claude/worktrees/<nome>`
  checa o mesmo número de arquivos que no checkout principal, e esse número é
  maior que zero.
- [x] Onda 1: `--timeout 120` do `monitor-ci` resulta em 7200 segundos no
  script.
- [x] Onda 2: `pnpm-workspace.yaml` fixa a `1.0.0-rc.7`,
  `git check-ignore deploy/.env.migrator.example` não devolve nada e o
  `template-smoke` passa.
- [x] Onda 2: o check `DMPF / DMPF` do PR draft tem resultado registrado no
  addendum da ADR-011.
- [x] Onda 3: um PR só com `docs/**/*.md` recebe o check `CI` verde, com
  `main` e `template-smoke` pulados.
- [x] Onda 3: nenhum `uses:` de workflow ou composite aponta para tag móvel.
- [x] Onda 3: `detect-apps` devolve `["apps/backend/<app>"]` para uma app
  afetada no layout de dois níveis.
- [ ] Onda 4: `node tools/adr-verify.mjs` passa nos ADRs do template, e os
  testes de `tools/tests/adr-verify/` passam.
- [ ] Onda 4: `AGENTS.md` com no máximo 150 linhas fora do bloco Nx.
- [ ] Validação do projeto passando ao fim de cada onda (constraint P0).

### Cenários de teste

```text
DADO o template na rc.3 com os 67 arquivos gerenciados íntegros
QUANDO rodar nx migrate para a rc.7, pnpm install e --run-migrations
ENTÃO o git status mostra só arquivos do dmpf.rendered.json, pins e os passos manuais do BKP-15, e o template-smoke passa

DADO um PR para develop que altera só docs/onboarding.md
QUANDO o ci.yml roda
ENTÃO o job Escopo emite code=false, main e template-smoke ficam skipped e o job CI termina success

DADO um PR que altera um .ts com erro de tipo
QUANDO o ci.yml roda
ENTÃO o job main falha e o job CI termina failure

DADO um derivado com modulePrefix diferente de example.com/change-me
QUANDO o ci.yml roda
ENTÃO o template-smoke é pulado e o CI segue verde

DADO um .go em stage com erro de sintaxe
QUANDO o pre-commit roda
ENTÃO o gofmt -l reprova o commit mesmo com saída vazia

DADO o merge de release/1.2.0-rc.1 em master
QUANDO o nx-release.yml roda
ENTÃO a versão liberada é 1.2.0-rc.1 e a publicação usa a dist-tag next
```

<critical_constraints>
- [P0] Arquivo listado no `dmpf.rendered.json` muda só por `nx migrate`. Copiar arquivo DMPF de um derivado é proibido (ADR-011).
- [P0] Itens classe D ficam fora: código de domínio, parâmetros do `init` de cada derivado e código do kernel, do plugin e do conformance da plataforma.
- [P0] Não regredir onde o template está à frente: credencial no `.npmrc` de usuário e input `install` do composite `setup-node-pnpm`; inputs por `env` no `publish-libs.yaml`; `fetchRetries` e `fetchRetryMintimeout` no `pnpm-workspace.yaml`; `docs/ci-cd/` sem dependência do `actions-templates`; `nx-publish-libs.yml`.
- [P0] Criar ruleset, secret ou variável no GitHub exige autorização explícita do usuário no momento da execução.
- [P0] Cada onda termina verde: `pnpm biome ci .`, `pnpm nx affected -t lint,typecheck,test,build --exclude=@nx-base-template/source` e `bash tools/template-smoke.sh`.
- [P1] Nenhum `.env.*.example` versionado contém segredo real.
- [P1] Um commit por BKP, em Conventional Commits PT-BR com scope `workspace` e a chave `DEVS-<n>` da sub-issue da onda. Ondas não se misturam num PR.
- [P1] Patch local em ativo que vem de upstream (Nx, DMPF) é acompanhado do registro do defeito upstream.
</critical_constraints>

## Escopo fora

- **BKP-27 (composite `docker-hub-mirror`)**: só faz sentido quando o CI do
  template puxar imagens. O reutilizável do DMPF já tem o seu.
- **BKP-33 (overlays raiz do k8s)**: dependem do `edge` e de `infra/`, que é
  saída do plugin. O caminho é o plugin gerar esses arquivos.
- **Encaminhamento upstream**: exclusões do `GO_NAMED_INPUT`, overlays do
  k8s, `.nxignore` no `init` e `!.env.*.example` no `.gitignore` gerenciado
  (`@mateusmacedo/dmpf-plugin`); unidade do `--timeout` do `monitor-ci`
  (Nx `configure-ai-agents`). São issues em outros repositórios, abertas à
  parte.
- **Classe D**: código de domínio dos derivados, `dmpf.json` e
  `dmpf.rendered.json` de cada derivado, arquivos derivados das apps pelo
  `infrasync`, `release.groups` `go-contract-*`, ADRs 012+ dos derivados e
  os ativos exclusivos da plataforma (workflows `dmpf-*`, `load.yml`,
  `sonar.yml`, custom managers do toolchain Go no Renovate, CODEOWNERS por
  contrato).
- **Falha da release 4803 no Gitea**: já resolvida pela SPEC-BG2K2W30, e a
  ADR-010 tirou o template do Gitea.
- **`apps/backend/playground/`**: experimento local, fora do versionamento
  (D1).
