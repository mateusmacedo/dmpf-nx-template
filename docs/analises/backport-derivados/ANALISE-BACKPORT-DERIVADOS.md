# Análise — melhorias dos projetos derivados que devem voltar ao template

| Campo | Valor |
| --- | --- |
| Data | 2026-10-30 |
| Template (linha de base) | `nx-base-template`, HEAD `980c3aa` (2026-10-10), branch `develop` |
| marketplace | `master` `9b7ae05` (2026-10-26). Criado do template em 2026-10-21; o commit inicial `b4649d2` tem a mesma árvore de `980c3aa` |
| antecipa-market | `master` `7f7310d` (2026-10-21). Criado do template em 2026-10-10; o commit inicial `cf5497c` tem a mesma árvore de `980c3aa` |
| lidercap-platform | `develop` `7e74b6ff` (2026-10-25). Sem ancestral comum; comparação arquivo a arquivo |
| Escopo | Scaffold de engenharia: configs raiz, `.github/`, `.claude/`, `.agents/`, `tools/` e `docs/` genéricos |
| Fora do escopo | Código de domínio (`apps/`, `libs/`, specs e docs de produto) e código do kernel/plugin DMPF |
| Modo | Somente leitura nos quatro repositórios |

Nos dois derivados, o delta é exato: `git diff <commit-inicial> HEAD` mostra tudo o que mudou depois da cópia. Na plataforma, a comparação foi feita arquivo a arquivo, com o `git log` por caminho para achar a motivação de cada mudança.

Legenda das classes:

- **A**: genérico, vai para o template como está.
- **B**: genérico, mas precisa de parametrização ou limpeza.
- **C**: chega pelo bump do `@mateusmacedo/dmpf-plugin` (ou de outra ferramenta) e não deve ser copiado à mão.
- **D**: específico do projeto, não levar.

---

## Resumo executivo

1. **O maior bloco é o bump do `@mateusmacedo/dmpf-plugin` de `1.0.0-rc.3` para `1.0.0-rc.7`.** Os dois derivados fizeram o bump, e nenhum dos 80 arquivos gerenciados de cada um foi editado à mão (o hash de cada um confere com o `dmpf.rendered.json`). Os 67 gerenciados do template também estão íntegros, então o `nx migrate` reescreve tudo sem `--force`. O bump traz Keycloak de referência, Redis com ACL, Go `1.26.10`, `golangci-lint` `v2.15.0` e ativos de IA novos. Três coisas ele não faz sozinho: o include do Keycloak no compose seed, o `infrasync --write` e os textos com versão escrita à mão.
2. **Os derivados e a plataforma expuseram defeitos latentes no template.**
   - O `.gitignore` ignora `.env.*.example`, e a `rc.7` gera `deploy/.env.migrator.example`. No antecipa-market o `partner` já referencia esse arquivo, que não está versionado.
   - O `@nx/docker` roda sem contexto na raiz, contra o `Dockerfile.node.example` do próprio template.
   - O `monitor-ci` documenta 120 minutos de timeout, mas o script recebe o valor como segundos.
   - O `detect-apps` sempre devolve `[]` no layout `apps/backend/<app>`.
   - O Renovate abre PR na `master`, contra o git-flow.
   - A publicação usa sempre `latest`.
   - O `!**/.claude` do Biome zera o check dentro de um worktree.
3. **A governança documentada não existe no GitHub.** O `AGENTS.md:224` diz que `master` e `develop` têm rulesets. Em 2026-10-30, `gh api repos/mateusmacedo/dmpf-nx-template/rulesets` devolveu `[]`, e `branches/{develop,master}/protection` devolveu `404 Branch not protected`. Quando o ruleset for criado, o `paths-ignore` do `ci.yml` vai travar todo PR só de documentação.
4. **Derivar do template hoje tem atrito previsível.**
   - Os dois derivados removeram o `template-smoke`, que falha sempre fora do `modulePrefix` reservado.
   - O marketplace editou 13 arquivos à mão para trocar a identidade.
   - O `nxCloudId` é herdado, então todo derivado compartilha o cache do Nx Cloud do template.
   - O GitHub não copia ruleset para o repositório criado a partir do template.
   - A numeração de ADR colide: marketplace e antecipa-market já usam `012+`.
   - O antecipa-market commitou `.obsidian/`, com cerca de 68 mil linhas.
5. **O WIP local do template já cobre os ajustes de agents e skills dos derivados.** O `model: opus` e as `skills:` do `golang-pro` ficaram 46 de 46 idênticos ao marketplace e 51 de 51 ao antecipa-market; falta só o commit. O mesmo WIP também apaga o `tsconfig.base.json`, o que nenhum derivado fez e que o `AGENTS.md` ainda descreve.

---

## Matriz consolidada

Cada item consolida achados equivalentes das três fontes. Os IDs de origem (`MKT-*`, `ANT-*`, `PLT-*`) apontam para os anexos.

| ID | Item | Classe | Fontes | Esforço | Risco | Onda |
| --- | --- | --- | --- | --- | --- | --- |
| BKP-01 | Consolidar o WIP `model: opus` e decidir sobre `tsconfig.base.json` e `apps/backend/playground/` | A | MKT-06, ANT-09 | P | Baixo | 0 |
| BKP-02 | Rulesets: criar no GitHub ou corrigir o `AGENTS.md` | B | PLT-12 | P | Médio | 0 |
| BKP-03 | Política do Nx Cloud: `nxCloudId` herdado e token ausente no CI | B | PLT-16, MKT-08 | P | Médio | 0 |
| BKP-04 | `.gitignore`: liberar `.env.*.example` | A | MKT-04, ANT-01 | P | Nulo | 1 (junto da onda 2) |
| BKP-05 | Ignorar `graphify-out/` e `.obsidian/` e recomendar a extensão `golang.go` | A | PLT-10, ANT-12 | P | Baixo | 1 |
| BKP-06 | Biome: `vcs.useIgnoreFile` e negações ancoradas na raiz | A | PLT-01 | P | Baixo | 1 |
| BKP-07 | `.nxignore` com `**/testdata/**` | A | PLT-09 | P | Baixo | 1 |
| BKP-08 | Skill `monitor-ci`: converter o timeout de minutos para segundos | A | PLT-07 | P | Baixo | 1 |
| BKP-09 | Renovate: base `develop`, alertas OSV, `ignorePaths` e gomod indireto | A | PLT-06 | P | Baixo | 1 |
| BKP-10 | `nx-release.yml`: `LEFTHOOK=0`, `pnpm --silent nx show` e input `version` | A | PLT-05 | P | Baixo | 1 |
| BKP-11 | Lefthook: pre-push numa invocação com base no remoto e pre-commit `gofmt` | A | PLT-02, PLT-03 | P | Baixo | 1 |
| BKP-12 | Skills Go: testcontainers-go pela API `Run` | A | PLT-08 | P | Baixo | 1 |
| BKP-13 | Texto sobre o PR de release aberto pelo `GITHUB_TOKEN` | A | PLT-11 | P | Baixo | 1 |
| BKP-14 | Bump do `dmpf-plugin` `rc.3` → `rc.7` via `nx migrate` | C | MKT-01, ANT-03 a ANT-06, PLT-29 | M | Médio | 2 |
| BKP-15 | Passos manuais do bump (compose seed, `infrasync`, textos de versão e smoke) | B | MKT-02, ANT-07 | P | Baixo | 2 |
| BKP-16 | Revalidar a premissa "`dmpf-ci.yml` vermelho no template" com a `rc.7` | B | MKT-03 | P a M | Baixo | 2 |
| BKP-17 | Docs DMPF/Go: `git add` antes do gate, specs de contexto, armadilhas do `nx-go`, overrides e `golang-pro` | A/B | MKT-05, MKT-09, PLT-23, PLT-25, PLT-28 | P | Baixo | 2 |
| BKP-18 | Actions fixadas por SHA, runtime Node 24 e permissões por job | A | PLT-04 | M | Baixo | 3 |
| BKP-19 | `@nx/docker`: `docker:build` a partir da raiz | B | ANT-02, PLT-15 | P | Médio | 3 |
| BKP-20 | CI: job de escopo e check agregador `CI` no lugar do `paths-ignore` | B | PLT-12 | M | Médio | 3 |
| BKP-21 | Semente de cache do pnpm em `develop` e `master` | B | PLT-17 | P | Baixo | 3 |
| BKP-22 | `detect-apps` pelo grafo do Nx e `contains(fromJSON())` no CD | B | PLT-14 | M | Médio | 3 |
| BKP-23 | `namedInputs`: tirar `CHANGELOG.md` (e, no Go, `*.md`, `package.json` e `Dockerfile`) do hash | B | PLT-13 | P | Médio | 3 |
| BKP-24 | Pré-release `release/X.Y.Z-<pre>` com dist-tag `next` | B | PLT-18 | M | Médio | 3 |
| BKP-25 | Workflow agendado de gates, com guarda quando não há `go.mod` | B | PLT-19 | P | Médio | 3 |
| BKP-26 | Docs: tabela "Esteira de CI por etapa" | B | PLT-24 | M | Baixo | 3 |
| BKP-27 | Composite `docker-hub-mirror` | B | PLT-27 | P | Baixo | Adiado |
| BKP-28 | Checklist ou script de derivação do template | B | MKT-08, ANT-10, PLT-12, PLT-16 | P a M | Baixo | 4 |
| BKP-29 | Convenção de numeração de ADR e `tools/adr-verify.mjs` | B | PLT-20, notas de MKT e ANT | M | Baixo | 4 |
| BKP-30 | `AGENTS.md` enxuto | B | PLT-26 | M | Médio | 4 |
| BKP-31 | Rules de IA: `language-review`, `agent-organizer`, `comment-discipline` e `process-enforcement` | B | PLT-21, PLT-22 | P | Baixo | 4 |
| BKP-32 | `.claude/settings.json`: `enabledPlugins` e subconjunto read-only de `permissions` | B | MKT-07, ANT-11 | P | Baixo | 4 |
| BKP-33 | Overlays raiz do k8s `dev`/`hmg` | B | ANT-08 | M | Médio | Adiado |

Esforço: P = pequeno, M = médio, G = grande.

---

## Onda 0 — decisões e pré-requisitos

### BKP-01 | Consolidar o WIP de agents e skills

- **Situação:** o working tree do template muda `model: sonnet` para `model: opus` em 51 arquivos de `.claude/agents` e `.claude/skills` e acrescenta `skills:` ao `golang-pro`. O resultado é byte a byte igual ao dos dois derivados (marketplace `79c10d8`, antecipa-market `5893017` e `f39bd2c`).
- **Atenção:** o mesmo WIP apaga o `tsconfig.base.json` (23 linhas) e deixa `apps/backend/playground/` não rastreado. Nenhum derivado faz isso, e o `AGENTS.md` ainda descreve o `tsconfig.base.json` com `paths` vazio. Confirmar se as duas mudanças são intencionais antes de commitar.
- **Recomendação:** commitar só a parte de agents e skills, num commit separado. O WIP não toca arquivos gerenciados pelo plugin (a interseção com o `dmpf.rendered.json` é vazia), então não conflita com o bump.

### BKP-02 | Rulesets: o `AGENTS.md` descreve proteção que não existe

- **Evidência:** `AGENTS.md:224` diz "`master` e `develop`, por rulesets do GitHub. `develop` exige PR e o check do CI verde, sem deleção e sem force push". A API devolve `[]` para os rulesets e `404 Branch not protected` para as duas branches (verificado em 2026-10-30).
- **Impacto:** hoje é possível dar push direto e force push em `master` e `develop`. Os outros derivados também não herdam ruleset: o GitHub não copia ruleset para o repositório criado a partir de um template.
- **Recomendação:** criar os rulesets junto com o BKP-20, porque com o `paths-ignore` atual o PR só de documentação nunca recebe o check obrigatório. Registrar o passo de criação no checklist de derivação (BKP-28). Até lá, corrigir a frase do `AGENTS.md`.

### BKP-03 | Política do Nx Cloud

- **Evidência:** o `nx.json:159` tem `"nxCloudId": "6a5d373ddbc8c8c89a15bb24"`, e nenhum workflow passa `NX_CLOUD_ACCESS_TOKEN`. A plataforma nasceu com o mesmo ID, trocou por `neverConnectToCloud: true` (`9324c8d6`) e depois criou um workspace próprio (`68149074`). O marketplace trocou o ID em `e3c26ab` e teve de reformatar o `nx.json` com o Biome em seguida (`23ea74c`), porque o `nx connect` o reescreve.
- **Impacto:** todo derivado compartilha o cache e o workspace do Nx Cloud do template até alguém trocar o ID. E o CI do template não aproveita o cache remoto.
- **Recomendação:** decidir entre dois caminhos.
  - No template, `neverConnectToCloud: true`, com a instrução `pnpm nx connect` mais `pnpm biome format --write nx.json` no derivado.
  - Manter o ID e documentar a troca obrigatória.

  Nos dois casos, ligar o secret no `ci.yml`.

---

## Onda 1 — correções de baixo risco

### BKP-04 | `.gitignore`: liberar `.env.*.example`

- **Evidência:**
  - `.gitignore:63-65` do template: `.env`, `.env.*` e `!.env.example`. Com isso, `git check-ignore` ignora `apps/x/deploy/.env.migrator.example`.
  - A `rc.7` gera `deploy/.env.migrator.example` em cada contexto, e o target `deploy-env` faz `cp` dele.
  - O marketplace corrigiu em `23ec6b8`; o antecipa-market corrigiu em parte, em `c12d3ef` (só `!.env.session-events.example`).
  - No antecipa-market, `apps/backend/partner/project.json` referencia um `.env.migrator.example` que não está versionado: o defeito já se manifestou.
- **Recomendação:** acrescentar `!.env.*.example` logo depois de `!.env.example`, no mesmo PR do bump (BKP-14). Antes, conferir que nenhum `.env.*.example` carrega segredo real.

### BKP-05 | Ignorar `graphify-out/` e `.obsidian/` e recomendar a extensão `golang.go`

- **Evidência:** a plataforma ignora os dois diretórios (`58befca0`, `3fb07400`). O antecipa-market commitou `.obsidian/` com cerca de 68 mil linhas de bundles de plugins (`477046a`). O próprio template tem `graphify-out/` na plataforma vizinha e usa o Obsidian.
- **Recomendação:** acrescentar as duas entradas ao `.gitignore`, `!.obsidian` ao Biome (junto do BKP-06) e `golang.go` ao `.vscode/extensions.json`.

### BKP-06 | Biome: respeitar o `.gitignore` e ancorar as negações na raiz

- **Evidência:**
  - O Biome resolve os padrões contra o caminho absoluto. `!**/.claude` casa o worktree sob `.claude/worktrees/`, e `!**/tmp` casa um clone sob `/tmp`; o resultado é `Checked 0 files` com exit 1 (plataforma, `38350134`).
  - Sem `vcs.useIgnoreFile`, o Biome processa artefatos ignorados (`cbc659bc`).
  - O template usa worktrees e tem `!**/.claude`, então tem o mesmo defeito.
- **Recomendação:**
  - Acrescentar `"vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true }`.
  - Ancorar as negações de diretórios-raiz (`!.claude`, `!.agents`, `!.nx`, `!plans`, `!tmp`, `!.remember` etc.).
  - Manter `**/` só no que aparece por projeto (`dist`, `coverage`, `node_modules`).
  - Manter as exclusões do DMPF (`!dmpf.json`, `!dmpf.rendered.json`, `!infra`, `!tools/dmpf-baseline`).
  - Conferir que a contagem de arquivos do `pnpm biome ci .` não muda num checkout limpo.

### BKP-07 | `.nxignore` com `**/testdata/**`

- **Evidência:** sem esse arquivo, o `@nx-go/nx-go` infere como projeto qualquer fixture com `go.mod` próprio (plataforma, `d312594e`).
- **Recomendação:** criar o arquivo. É preventivo: o primeiro bounded context pode trazer fixtures.

### BKP-08 | `monitor-ci`: timeout em minutos que vira segundos

- **Evidência:** o `.agents/skills/monitor-ci/SKILL.md:27` documenta `--timeout 120` "in minutes", mas a linha 183 passa `--timeout <timeout_seconds>` ao script. O `ci-poll-decide.mjs:42,129` compara em segundos, então o teto real é de 2 minutos. A plataforma corrigiu em `b8aab4e3`: converte com `* 60`, acrescenta `--elapsed-seconds` entre tentativas e devolve `limitReached`. Depois, em `70e81115`, trocou para `Number.parseInt`.
- **Recomendação:** aplicar o patch nas duas cópias, `.agents/skills/` e `.github/skills/`, se existir. A skill vem do Nx e uma regeneração pode sobrescrever o patch; vale reportar o defeito upstream.

### BKP-09 | Renovate alinhado ao git-flow

- **Evidência:** o `renovate.json:4` do template tem `"baseBranchPatterns": ["master"]`, e os PRs de dependência pulam a `develop`. A plataforma corrigiu em `4de6c9fa`: base `develop`, `:enableVulnerabilityAlerts`, `osvVulnerabilityAlerts: true` e `ignorePaths` para `testdata`, `__fixtures__` e `examples`. Acrescentou ainda duas regras gomod: a dependência `indirect` é consultada, mas só o alerta de vulnerabilidade a sobe. O caso que motivou a mudança foi um `x/net` indireto que reprovou o `govulncheck`.
- **Recomendação:** copiar esses itens e manter as regras do template que desligam o plugin DMPF, o `@nx-go/nx-go` e o `mateusmacedo/dmpf`. Os custom managers do toolchain Go ficam de fora (C, ver "Não levar").

### BKP-10 | `nx-release.yml`: três ajustes de robustez

- **`LEFTHOOK: "0"` no job `version`:** o `pnpm install` roda o `prepare` (`lefthook install`), e o `git push --atomic` do job dispara o pre-push no runner, o que abortava a release (plataforma, `5eb79b33`).
- **`pnpm --silent nx show projects ... --json`:** depois do `nx release`, o pnpm escreve no stdout e quebra o JSON (`ea6d8e92`). O template usa `pnpm nx show` nas linhas 91 e 141.
- **Input `version` no `workflow_dispatch`, validado por regex semver:** serve para refazer uma release que falhou.

### BKP-11 | Lefthook: pre-push mais rápido e pre-commit `gofmt`

- **Evidência do pre-push:** o template roda quatro `pnpm nx affected` (`lefthook.yml:11-17`) com a base default `master`. No git-flow, isso inclui tudo o que ainda não foi liberado, e o grafo é recalculado quatro vezes. Na plataforma, o pre-push levava de 6 a 12 minutos e o push por SSH caía por ociosidade (ADR-069 da plataforma, `c440f2b8`).
- **Recomendação para o pre-push:**

  ```yaml
  affected:
    run: |
      base="$(git rev-parse --verify --quiet '@{push}' || git merge-base HEAD origin/develop)" || exit 1
      pnpm nx affected -t lint,typecheck,test,build --base="$base" --head=HEAD --parallel=3 --exclude=@nx-base-template/source
  ```

- **Pre-commit `gofmt -l`:** só para `.go` em stage, guardando a saída e o status separados. Assim, o arquivo com erro de sintaxe também reprova (plataforma, `e5b37bd6`).

### BKP-12 | Skills Go: API `Run` do testcontainers-go

- **Evidência:** `.claude/skills/skill-go-testing/SKILL.md` e `skill-unit-integration-testing/SKILL.md` ensinam `RunContainer` e `WithImage`, deprecated desde a v0.32. A plataforma usa `tcpostgres.Run(ctx, "postgres:16-alpine", ...)` e `testcontainers.CleanupContainer(t, pg)` (`ae4af737`). O WIP do template não cobre isso.

### BKP-13 | Texto sobre o PR de release aberto pelo `GITHUB_TOKEN`

- **Evidência:** o `create-release.yml` (`::notice::`), o `CONTRIBUTING.md` e o `docs/guides/development-workflow.md` dizem que o PR aberto pelo `GITHUB_TOKEN` "não dispara o CI". O correto é que ele dispara execuções que o GitHub encerra sem nenhum job. A plataforma também orienta abrir o PR "depois do primeiro push com commits", porque a branch nasce igual à `master` (`13f582cb`, `2fa633d1`).

---

## Onda 2 — bump do DMPF `rc.3` → `rc.7`

### BKP-14 | `nx migrate` do plugin

- **O que chega** (comprovado pelo render dos templates do plugin, que reproduziu 71 de 71 arquivos do template em `rc.3` e 82 de 84 do marketplace em `rc.7`): 13 arquivos novos e 19 alterados.
  - **Novos:**
    - `infra/k8s/base/redis/*` (4 arquivos);
    - `infra/keycloak/**` (8 arquivos, realm `dmpf`, Keycloak 26.8.1);
    - `infra/local/compose/keycloak.yml`.
  - **Alterados:**
    - `.agents/skills/dmpf-bounded-context/**` e `dmpf-testkit/**`;
    - `.claude/{agents,commands,rules}/dmpf-*`;
    - `.env.example` (`REDIS_URL`, `KEYCLOAK_*`);
    - `.golangci.yml` (IDN-14, depguard do testkit);
    - os composes de Postgres, Redis e exporters;
    - `infra/local/env.platform.example`;
    - `infra/test/compose.yml` (+77 linhas: Redis e Keycloak de teste).
  - **Pins:**
    - catalog e `minimumReleaseAgeExclude` (`pnpm-workspace.yaml:27,66`);
    - `go.work` `1.26.9` → `1.26.10` (o antecipa-market cita a GO-2026-6809 em `e9ff133`; o advisory não foi verificado);
    - `golangci-lint` `v2.13.2` → `v2.15.0` no `nx.json`;
    - `dmpf-ci.yml` com o `workflowRef` `5def4d2` → `ddd3d0c`.
  - **Contextos futuros:** passam a nascer com a role `<app>_migrator`, `deploy/.env.migrator.example` e a deny-list de revogação no Redis.
- **Sequência:**

  ```bash
  pnpm nx migrate @mateusmacedo/dmpf-plugin@1.0.0-rc.7
  pnpm install
  pnpm nx migrate --run-migrations
  ```

  A `migrations.json` da `rc.7` só tem entradas `rc.7` (`sync-init` e `update-versions`), então o salto direto roda cada migration uma vez.
- **Regras:** não copiar arquivo DMPF à mão (ADR-011). Incluir o BKP-04 no mesmo PR.
- **Risco:** médio. O antecipa-market validou a `rc.4` com o smoke, mas aplicou `rc.5` e `rc.7` depois de remover o smoke. Nenhum derivado provou a `rc.7` nas condições do template, que não tem nenhum módulo Go.

### BKP-15 | Passos manuais que acompanham o bump

1. `infra/local/docker-compose.yml` é seed, e o `sync-init` não o reescreve. Acrescentar `- compose/keycloak.yml` ao `include`, depois do `swagger-ui.yml`. Os dois derivados fizeram isso à mão (marketplace `317f048`, antecipa-market `b297d0c`).
2. Rodar `go run github.com/mateusmacedo/dmpf/tools/dmpf-conformance/cmd/infrasync@v1.0.0-rc.7 --root . --write`. Ele regrava `infra/local/.env.example` e `compose/provisioning.generated.yml`: no marketplace, sem nenhuma app, foram +16 e +34 linhas. Revisar o diff antes de commitar, porque o efeito com zero apps não foi verificado aqui.
3. Atualizar as versões escritas à mão:
   - `AGENTS.md:196` (`rc.3`) e `AGENTS.md:147` (`go 1.26.9`);
   - `README.md:10`;
   - `docs/onboarding.md:13`;
   - `docs/guides/primeiro-bounded-context.md:6-7` (`5def4d2` → `ddd3d0c`, `rc.3` → `rc.7`).

   A ADR-011 e a spec de greenfield citam `rc.3` como histórico e ficam como estão.
4. Rodar `bash tools/template-smoke.sh`, que lê as versões do `versions.json` do plugin e não tem pin para editar.

### BKP-16 | Revalidar a premissa "`dmpf-ci.yml` vermelho no template"

- **Contexto:** a ADR-011, `AGENTS.md` (seção CI), `README.md` e `docs/ci-cd/README.md` dizem que o `dmpf-ci.yml` falha no gate de conformance enquanto não houver módulo Go.
- **Evidência:**
  - No marketplace, o addendum da ADR-012 (`3fa0e1b`) registra que o reutilizável da `rc.7` só roda o `dmpf-gate-check.sh` com `self-tests: true` (o padrão é `false`), e o job `DMPF / DMPF` passou.
  - O `dmpf-scope` da `rc.7` só roda o `conformance` quando o diff toca projetos Go, `*dmpf-units.json` ou `tools/dmpf-*`.
- **Ressalva:** o marketplace já tinha módulo Go quando isso foi observado.
- **Recomendação:** depois do BKP-14, abrir um PR draft, observar o `DMPF / DMPF` e só então reescrever os trechos, com addendum na ADR-011. Não copiar o texto de `8a91a96`, que o próprio marketplace corrigiu em `3fa0e1b`.

### BKP-17 | Docs e instruções de DMPF/Go

- **`docs/guides/primeiro-bounded-context.md`:** avisar que o `gate-check` só enxerga arquivos rastreados (`git ls-files '*dmpf-units.json'`), então é preciso dar `git add` no contexto gerado antes do gate (MKT-09).
- **`docs/specs/README.md`:** criar a seção "Specs de bounded context", com o template na skill `dmpf-bounded-context/references/template-bounded-context.md` e o comando `/dmpf-new-context SPEC-<id>`. Usar uma referência neutra no lugar da spec `bookings` da plataforma (PLT-25).
- **`docs/nx-reference/tasks.md`** (PLT-28), duas armadilhas:
  - `--skipFormat` é obrigatório no `@nx-go/nx-go:library`, porque o Prettier reformata o `nx.json` com largura 80 e o `biome ci` reprova;
  - o default por executor substitui o default por nome, então é preciso repetir `dependsOn` e `cache`.
- **Notas "Override DMPF":** acrescentar às skills `skill-go*` e às rules `file-organization` e `testing-conventions`, apontando só para `.claude/rules/dmpf-bounded-context.md` (PLT-23).
- **`AGENTS.md`, seção "Orquestração":** "Implementação de código Go: use sempre o agente `golang-pro`" (marketplace, `a98a2bb`).

---

## Onda 3 — CI/CD estrutural

### BKP-18 | Actions fixadas por SHA, runtime Node 24 e permissões por job

- **Evidência:**
  - O template usa tags (`actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, `docker/login-action@v3`, `nrwl/nx-set-shas@v5`), apesar de estender `helpers:pinGitHubActionDigests` no Renovate.
  - A plataforma fixa por SHA, com o comentário da versão, e usa actions com `runs.using: node24` (`1d4b97a0`).
  - A plataforma também troca as permissões de workflow por permissões por job, com `permissions: {}` no topo (`e1bc8f3b`).
- **Recomendação:** mudança mecânica em `ci.yml`, `create-release.yml`, `nx-release.yml`, `publish-libs.yaml`, `detect-apps.yaml` e no composite `setup-node-pnpm`. O job `main` do `ci.yml` precisa de `packages: read` por causa do plugin no GitHub Packages.

### BKP-19 | `@nx/docker`: build com o contexto na raiz

- **Evidência:**
  - O `nx.json:63-67` declara só o nome `docker:build`. O default do `@nx/docker` é `cwd = projectRoot` (`node_modules/@nx/docker/dist/src/plugins/plugin.js:92`).
  - O `infra/docker/Dockerfile.node.example` e o `docs/ci-cd/DEPLOY_APPLICATIONS.md` exigem o contexto na raiz.
  - O antecipa-market (`7bd0f28`) e a plataforma (`0f627bea`) corrigiram.
- **Recomendação:**
  - Usar `"buildTarget": { "name": "docker:build", "cwd": ".", "args": ["-f {projectRoot}/Dockerfile"] }`.
  - Acrescentar os `--secret` que o Dockerfile de referência pede (`id=npmrc`, `id=NODE_AUTH_TOKEN`).
  - Não copiar o `runTarget` (`--network host --env-file deploy/.env`), que é convenção DMPF; o generator `bounded-context` já escreve o próprio `docker:run`.
  - Validar com a primeira app Node, por exemplo o `apps/backend/playground`.

### BKP-20 | CI: escopo do diff e check agregador `CI`

- **Evidência:** com o `paths-ignore: ["**/*.md", ...]` do `ci.yml:9-11`, um PR só de Markdown nunca recebe o check obrigatório e fica bloqueado quando há ruleset (plataforma, `830537cb`, ADR-069).
- **Recomendação:**
  - **Job `Escopo`:** classificar o diff (`git diff --name-only "$BASE_SHA"...HEAD`). Contam como documentação `docs/**` e o `*.md` fora de `tools/`, `.claude/` e `.agents/`, porque o markdown dessas pastas é saída do `init`.
  - **Jobs pesados** (`main`, `template-smoke`): rodar só com `code == 'true'`.
  - **Job `CI`:** `needs` de todos, `if: always()` e `jq -e 'all(.[]; .result == "success" or .result == "skipped")'`. É o único check exigido pelo ruleset (BKP-02).
  - Declarar `CI: "true"` no `env`.
  - Opcional: `biome ci --changed` quando a config do Biome não mudou.
- **Risco:** médio. O nome do check muda, e o ruleset precisa nascer junto.

### BKP-21 | Semente de cache do pnpm

- **Evidência:** o `ci.yml` só roda em `pull_request`, e o PR só lê o cache da própria ref, da branch base e da default. A `develop` nunca recebe cache, e a `master` só recebe no `nx-release`, então todo PR novo parte do cache frio (plataforma, `2ee91742`).
- **Recomendação:** criar um `cache-seed.yml` com:
  - `push` em `develop` e `master`, filtrado por `pnpm-lock.yaml`, `pnpm-workspace.yaml` e `package.json`;
  - `schedule` semanal;
  - `workflow_dispatch`;
  - um passo que roda o composite `setup-node-pnpm`.

  A parte Go chega pelo reutilizável do DMPF.

### BKP-22 | `detect-apps` pelo grafo do Nx

- **Evidência:**
  - O `detect-apps.yaml:73` procura `"${dir}"/*/"${MARKER_FILE}"` com `app_dirs: apps`. No layout `apps/backend/<app>`, o resultado é sempre `[]`.
  - O exemplo do `cd-dev-hmg.yml` usa `contains(needs.detect.outputs.apps, 'apps/<app>')`, que casa por substring: `apps/foo` casa `apps/foo-bar`.
- **Recomendação** (plataforma, `73a3d441`):
  - Setup de Node e pnpm.
  - `nrwl/nx-set-shas` com `main-branch-name: ${{ github.ref_name }}`.
  - `pnpm --silent nx show projects --affected --type app --json`, filtrando pelo `marker_file`.
  - Exemplo do CD com `contains(fromJSON(needs.detect.outputs.apps || '[]'), 'apps/backend/<app>')`.
  - O job precisa de `packages: read`, `actions: read` e do `NODE_AUTH_TOKEN`.
  - Atualizar o `docs/ci-cd/DEPLOY_APPLICATIONS.md`.
- **Risco:** médio, restrito a quem ligar o CD.

### BKP-23 | `namedInputs`: menos invalidação de cache

- **Evidência:** o `CHANGELOG.md` e a versão no `package.json` que o `nx release` escreve invalidavam o cache de tudo (plataforma, `c1ce32f8`).
- **Recomendação:**
  - No `default`, excluir só `!{projectRoot}/**/CHANGELOG.md`. Não excluir o `README.md`, porque libs TS com bundler `tsc` o copiam para o `dist`.
  - No `go`, excluir `!{projectRoot}/**/*.md`, `!{projectRoot}/package.json` e `!{projectRoot}/Dockerfile`. O `GO_NAMED_INPUT` do plugin só é criado quando falta, então a edição manual persiste. Levar a mudança upstream para o plugin também.
- **Risco:** médio. Excluir o input errado gera cache stale silencioso.

### BKP-24 | Pré-release e dist-tag `next`

- **Evidência:** o `nx-release.yml:184` publica sempre com `tag: latest`, então uma pré-release viraria a `latest` no GitHub Packages.
- **Recomendação** (plataforma, `6ff2de0a`):
  - Quando o head do PR casar `^release/([0-9]+\.[0-9]+\.[0-9]+-[0-9A-Za-z.-]+)$`, rodar `nx release <versão>` explícito.
  - Criar o output `dist_tag`: `next` quando alguma versão tiver `-`, `latest` nos demais casos.
  - Combinar com o input `version` do BKP-10.
  - Documentar a "Pré-release" no `CONTRIBUTING.md`.
  - Não copiar o `sync-versions.mjs`, o filtro `dmpf@*` nem o job `consumer` da plataforma.
  - Validar num fork.

### BKP-25 | Gates agendados

- **Evidência:** uma vulnerabilidade apareceu depois do merge, e a release `1.0.0-rc.2` da plataforma saiu de um commit que o CI reprovou em seguida (`408bb493`). O guia `dmpf-consumo-externo.md` §5 da plataforma traz pronto um `dmpf-agendado.yml` para consumidores. Ele não pode reusar o `dmpf-go-ci.yml`, porque, sem diff, o escopo sai vazio.
- **Recomendação:** adicionar o workflow com uma guarda que pula quando não existe `go.mod`, para não nascer vermelho no template. Avaliar um job análogo de `pnpm audit`.

### BKP-26 | Docs: "Esteira de CI por etapa"

- **Recomendação:** escrever a tabela no `docs/ci-cd/README.md`, cobrindo `pre-commit`, `pre-push`, PR para `develop` e `release/**`, PR só de documentação, PR para `master`, `push` em `master`, agendado e semente de cache. Alinhar o `CONTRIBUTING.md`, o `docs/onboarding.md` e o `docs/guides/development-workflow.md`, que ainda descrevem o `paths-ignore` e o pre-push antigo. Fazer depois dos BKP-03, 11, 20, 21 e 25 (plataforma, `55c30731`, `7458883b`).

### BKP-27 | Composite `docker-hub-mirror` (adiado)

- O composite configura `mirror.gcr.io` no daemon Docker do runner, contra o limite de pull anônimo do Docker Hub (plataforma, `b8e3a3c8`).
- Só faz sentido quando o CI do template puxar imagens (e2e com compose ou testes de integração TS). O reutilizável do DMPF já tem o seu.

---

## Onda 4 — derivação e governança

### BKP-28 | Checklist ou script de derivação

O atrito para derivar do template é concreto e se repetiu nos dois projetos:

| Atrito | Evidência |
| --- | --- |
| Nome do pacote raiz em 13 arquivos: `ci.yml`, `nx-release.yml`, `nx-publish-libs.yml`, `publish-libs.yaml`, `PULL_REQUEST_TEMPLATE.md`, `AGENTS.md`, `README.md`, `docs/onboarding.md`, `development-workflow.md`, `primeiro-bounded-context.md`, `lefthook.yml`, `package.json` e `project.json` | marketplace `4b5483e` |
| `name:` do compose seed, linha do tracker | marketplace `317f048`, `4dfd051` |
| `nxCloudId` (BKP-03) | marketplace `e3c26ab`, plataforma `9324c8d6` |
| `template-smoke` falha sempre no derivado: exige o `modulePrefix` reservado `example.com/change-me` | antecipa-market `48fdda6`; o marketplace também o removeu |
| Ruleset não é copiado (BKP-02) | API do GitHub |
| Numeração de ADR colide (BKP-29) | ADRs 012 e 013 do marketplace e 012 a 022 do antecipa-market |

**Recomendação:**

- Criar a seção "Ao derivar deste template" no `docs/onboarding.md`, com a lista acima. Opcionalmente, um script em `tools/` que troque as strings de identidade.
- Condicionar o job `template-smoke` à leitura de `jq -r .modulePrefix dmpf.json`, pulando quando o valor não for o reservado. Assim o derivado herda o `ci.yml` sem editar e mantém o job inerte.

### BKP-29 | Convenção de numeração de ADR e verificador

- **Problema:** o template vai até a ADR-011. O marketplace usa 012 e 013, e o antecipa-market usa de 012 a 022, com decisões de produto. O próximo ADR do template, por exemplo o do bump `rc.7`, colide com os dois.
- **Recomendação:**
  - Definir no `docs/adr/README.md` uma faixa ou um prefixo para os ADRs do derivado. Por exemplo, o template reserva `001-099` e o derivado começa em `100`. Outra opção é o derivado usar um prefixo próprio.
  - Portar o `tools/adr-verify.mjs` da plataforma (686 linhas, 54 testes em `tools/tests/adr-verify/`, `dd35d594`). Ele faz oito checagens:
    - A1: bijeção arquivo ↔ heading;
    - A2: arquivo ↔ índice;
    - A3: numeração contínua;
    - A4: seções canônicas e `Addendum` único;
    - A5: alternativas e consequências;
    - A6: pendência com owner;
    - A7: sem referência por número de linha;
    - A8: spec existente.
  - Remover o cabeçalho que cita a spec de origem da plataforma.
  - Usar `--from` na adoção, porque os ADRs atuais podem reprovar em A5 ou A6.
  - Ligar no CI pelo critério de escopo do BKP-20.

### BKP-30 | `AGENTS.md` enxuto

- **Evidência:** a plataforma reduziu o arquivo de cerca de 400 para 119 linhas (`66f40e9b`, +38/−421). Conduta, git, refatoração e testes passaram a viver em `.claude/rules/`, e o detalhe por módulo, nos `README.md`.
- **Risco:** médio. O `AGENTS.md` do template é o que os derivados herdam, então cada regra cortada precisa existir numa rule.
- **Recomendação:** fazer depois do BKP-02, para corrigir a frase dos rulesets no mesmo movimento.

### BKP-31 | Rules de IA

- **`.claude/rules/language-review.md`** (plataforma, `495e5b1e`): revisão de prosa PT-BR e EN uma vez, no fim, com `pt-reviewer` e `en-reviewer` em paralelo, e não a cada edição. Alinhar o gatilho ao fluxo atual: uma vez, antes do PR, opcional.
- **`agent-organizer`:** ganhou `skills:` e as ferramentas `Skill`, `AskUserQuestion`, `Bash`, `LSP`, `Task`, `WebFetch` e `WebSearch`. Conferir se `MCPSearch` existe no ambiente antes de declarar.
- **`comment-discipline.md`:** a versão estrita, com default "zero comentários" (`042eaa6f`), é opinativa e fica a critério do template.
- **`process-enforcement.md`:** remover as seções "Reutilização" e "Go: processo e cadeia de validação", que são redundantes (`71c07e02`).

### BKP-32 | `.claude/settings.json`

- **`enabledPlugins` vazio:** o marketplace removeu `"nx@nx-claude-plugins": true` (`80a64c5`) sem registrar o motivo. A hipótese é que o plugin duplica as skills do Nx já versionadas em `.agents/skills/`. Confirmar antes de portar.
- **`permissions.allow`:** a lista do antecipa-market (`6848f41`) é acúmulo pessoal. Só o subconjunto read-only é aproveitável: `Bash(pnpm biome ci *)`, `Bash(gofmt -l *)`, `Bash(go vet ./...)`, `Bash(go version)`, `Bash(go doc *)` e `Bash(docker compose ls *)`. Deixar `pnpm config get *` fora, porque pode imprimir token de registry.

### BKP-33 | Overlays raiz do k8s (adiado)

- **Situação:** o antecipa-market portou à mão, da plataforma, os `infra/k8s/overlays/{dev,hmg}/kustomization.yaml` e auxiliares (`c12d3ef`). Sem eles, `kubectl apply -k infra/k8s/overlays/dev` não monta a plataforma.
- **Por que adiar:** o conteúdo depende da borda (`edge`), e `infra/` é saída do plugin.
- **Recomendação:** o caminho certo é pedir ao plugin que gere esses arquivos (upstream), e não copiar. A prioridade é baixa enquanto o template não tem apps.

---

## Encaminhar upstream (não é mudança no template)

| Destino | Item |
| --- | --- |
| `@mateusmacedo/dmpf-plugin` | Exclusões do `GO_NAMED_INPUT` (BKP-23) |
| `@mateusmacedo/dmpf-plugin` | Gerar os overlays raiz do k8s com `edge` condicionado (BKP-33) |
| `@mateusmacedo/dmpf-plugin` | Gerar o `.nxignore` com `**/testdata/**` no `init` (BKP-07) |
| `@mateusmacedo/dmpf-plugin` | Gerar `!.env.*.example` no `.gitignore` gerenciado, se o plugin passar a gerenciá-lo (BKP-04) |
| Nx (`configure-ai-agents`) | Bug de unidade do `--timeout` da skill `monitor-ci` (BKP-08) |

## Não levar (classe D)

- **Código de domínio:** `apps/backend/{bff,tenancy}` (marketplace), `apps/backend/{bff,identity,partner}` (antecipa-market), contratos, `go.work` com `use`/`replace` e `go.work.sum`.
- **Parâmetros do `init` de cada derivado:** `dmpf.json`, `dmpf.rendered.json`, o prefixo de módulo no `.golangci.yml`, `edge`, `composeProject` e `imageRegistry`.
- **Arquivos derivados das apps pelo `infrasync`:** overlays `apps` e `databases`, `pki.yml`, `swagger-ui.yml`, `provisioning.generated.yml`, `alloy-kubernetes.alloy` e `GRPC_TRUSTED_CLIENTS`.
- **No `nx.json`:** os `release.groups` `go-contract-*` (o generator os cria) e o `nxCloudId` de cada projeto.
- **Docs de produto:** ADRs 012+ dos derivados, `docs/product`, `docs/prd`, `docs/design`, `docs/reference`, `docs/roadmap.md` e specs de produto.
- **Remoção do `template-smoke`:** é específica do derivado. O ajuste útil está no BKP-28.
- **Plataforma:**
  - código do kernel, do plugin e do conformance;
  - os workflows `dmpf-*`, `load.yml` e `sonar.yml`;
  - as actions `dmpf-scope`, `dmpf-layout` e `setup-go`;
  - os scripts `tools/*-check.sh`, `external-consumer.sh` e `infra-*`;
  - o CODEOWNERS por contrato;
  - `.vscode/launch.json` e `tasks.json`;
  - o `sandbox` do `settings.json`;
  - os custom managers do Renovate para o toolchain Go, que brigariam com o `nx migrate` (PLT-30);
  - a detecção de primeira release por família de grupo (PLT-31; rever quando o template tiver o primeiro grupo).

## Onde o template já está à frente (não regredir ao portar)

- O composite `setup-node-pnpm` escreve a credencial do GitHub Packages no `.npmrc` de usuário e tem o input `install`.
- O `publish-libs.yaml` passa os inputs por `env`. A plataforma interpola `${{ inputs.* }}` dentro do `run`, o que abre vetor de injeção.
- O `pnpm-workspace.yaml` tem `fetchRetries` e `fetchRetryMintimeout`.
- O `docs/ci-cd/` não depende do repositório externo `actions-templates`.
- O `.github/workflows/` do template tem `nx-publish-libs.yml` para republicação manual.

## Ordem sugerida e dependências

```text
Onda 0  BKP-01 (commit do WIP) ─┐
        BKP-02 + BKP-03 (decisões) ─┼─> Onda 3 (BKP-20 precisa do ruleset; BKP-26 documenta o resultado)
                                    │
Onda 1  BKP-05..13 (PRs pequenos e independentes; BKP-05 junto do BKP-06)
                                    │
Onda 2  BKP-14 + BKP-04 + BKP-15 (mesmo PR) ─> BKP-16 (PR draft) ─> BKP-17
                                    │
Onda 3  BKP-18, 19, 21, 22, 23, 24, 25 ─> BKP-26
Onda 4  BKP-28, 29, 30, 31, 32 (BKP-30 depois do BKP-02)
Adiado  BKP-27, BKP-33
```

Os itens de maior retorno por esforço são os BKP-04, 06, 08, 09, 10 e 11 (defeitos reais, todos P) e o BKP-14 com o BKP-15 (alinha o template com os derivados).

## Pendências e incertezas

- O `template-smoke` e o `dmpf-ci.yml` não foram executados contra a `rc.7`. O resultado do BKP-14 foi previsto pelo render dos templates, não por execução.
- O efeito do `infrasync --write` com zero apps não foi verificado.
- O advisory GO-2026-6809 citado no antecipa-market (`e9ff133`) não foi conferido na fonte.
- O motivo do `enabledPlugins` vazio no marketplace não está documentado (BKP-32).
- Ainda não está decidido se a remoção do `tsconfig.base.json` no WIP do template é intencional (BKP-01).

## Anexos

Os relatórios detalhados por repositório, com trechos de diff, linhas e hashes de cada achado:

- `ANALISE-BACKPORT-DERIVADOS-anexo-marketplace.md` (MKT-01 a MKT-09)
- `ANALISE-BACKPORT-DERIVADOS-anexo-antecipa-market.md` (ANT-01 a ANT-18)
- `ANALISE-BACKPORT-DERIVADOS-anexo-lidercap-platform.md` (PLT-01 a PLT-31)

Os anexos citam artefatos de apoio em `scratchpad/` (render dos templates do plugin em `r7_tpl` e cópias do `dmpf-go-ci.yml` e do `dmpf-scope.sh`). Esses artefatos eram temporários da sessão de análise e não foram preservados. Para reproduzir, renderize de novo a `rc.7` ou leia o reutilizável no SHA `ddd3d0c`.
