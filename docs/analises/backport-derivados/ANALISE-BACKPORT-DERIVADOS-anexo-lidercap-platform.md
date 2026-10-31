# Delta de scaffold de engenharia: lidercap-platform → nx-base-template

## Escopo e método

- **Plataforma:** `/home/mateus/work/Projects/lidercap/lidercap-platform`, branch `develop`, HEAD `7e74b6ff` (2026-10-25), 1657 commits.
- **Template (linha de base):** `/home/mateus/work/Projects/lidercap/nx-base-template`, HEAD `980c3aa` (2026-10-10), lido por `git show HEAD:<path>`. O WIP não commitado foi ignorado, salvo quando citado.
- **Comparação:** arquivo a arquivo (sem ancestral comum) nas configs raiz, `.github/`, `.claude/`, `.agents/`, `.vscode/`, `tools/` e `docs/`, mais o `git log` dos últimos ~3 meses por caminho, para achar a motivação de cada mudança. Os diffs brutos ficaram em `scratchpad/diffs/`.
- **Fora do escopo:** código do kernel, do `dmpf-plugin` e do `dmpf-conformance`, `docs/dmpf/`, ADRs e specs de domínio, `draft/`, `graphify-out/`.
- **Verificações externas, só de leitura:**
  - `gh api repos/mateusmacedo/dmpf-nx-template/rules/branches/{develop,master}` devolveu `[]`: o template não tem ruleset ativo, embora o `AGENTS.md` diga que tem.
  - A plataforma tem dois rulesets: `CI obrigatório na develop`, que exige o check `CI`, e `Proteção da master`.
  - O código do `nrwl/nx-set-shas@v5` confirma que, em `pull_request`, a base vem de `payload.pull_request.base.ref`, e não do `main-branch-name`.

**Classes:**

- **A:** genérico, pode ir como está.
- **B:** genérico, mas precisa de parametrização ou limpeza.
- **C:** chega via bump do `@mateusmacedo/dmpf-plugin` (ou de outra ferramenta) e não deve ser copiado à mão.
- **D:** específico da plataforma.

## Resumo

| ID | Título | Classe | Esforço | Risco |
| --- | --- | --- | --- | --- |
| PLT-01 | Biome respeitando `.gitignore` e negações ancoradas na raiz | A | P | Baixo |
| PLT-02 | Pre-push numa invocação, com base no que o remoto já tem | A | P | Baixo |
| PLT-03 | Pre-commit `gofmt -l` nos `.go` em stage | A | P | Baixo |
| PLT-04 | Actions fixadas por SHA, runtime Node 24 e permissões por job | A | M | Baixo |
| PLT-05 | `nx-release`: `LEFTHOOK=0`, `pnpm --silent nx show` e input `version` | A | P | Baixo |
| PLT-06 | Renovate: PR na `develop`, alertas de vulnerabilidade, `ignorePaths`, gomod indireto | A | P | Baixo |
| PLT-07 | Skill `monitor-ci`: timeout em minutos, `--elapsed-seconds`, `limitReached` | A | P | Baixo |
| PLT-08 | Skills Go: testcontainers-go pela API `Run` | A | P | Baixo |
| PLT-09 | `.nxignore` com `**/testdata/**` | A | P | Baixo |
| PLT-10 | Ignorados e extensões: `graphify-out/`, `.obsidian/`, `golang.go` | A | P | Baixo |
| PLT-11 | Texto da release: PR pelo `GITHUB_TOKEN` e "depois do primeiro push com commits" | A | P | Baixo |
| PLT-12 | CI: check agregador `CI`, classificação do diff no lugar de `paths-ignore` e ruleset | B | M | Médio |
| PLT-13 | `namedInputs`: tirar markdown, `package.json` e `Dockerfile` do hash | B | P | Médio |
| PLT-14 | `detect-apps` pelo grafo do Nx e `cd-dev-hmg` com `contains(fromJSON())` | B | M | Médio |
| PLT-15 | `@nx/docker`: `docker:build` a partir da raiz do monorepo | B | P | Médio |
| PLT-16 | Nx Cloud: `nxCloudId` herdado pelos derivados e token ausente no CI | B | P | Médio |
| PLT-17 | Semente de cache (pnpm) em `develop`/`master` | B | P | Baixo |
| PLT-18 | Pré-release `release/X.Y.Z-<pre>` e dist-tag `next` | B | M | Médio |
| PLT-19 | Workflow agendado para gates que reprovam sem diff | B | P | Médio |
| PLT-20 | `tools/adr-verify.mjs`: verificador do acervo de ADRs | B | M | Baixo |
| PLT-21 | Rule `language-review.md` e `agent-organizer` com `skills:` | B | P | Baixo |
| PLT-22 | `comment-discipline.md` mais estrita e `process-enforcement.md` enxuta | B | P | Baixo |
| PLT-23 | Notas "Override DMPF" nas skills e rules genéricas de Go | B | P | Baixo |
| PLT-24 | Docs: "Esteira de CI por etapa" e docs de contribuição alinhados | B | M | Baixo |
| PLT-25 | `docs/specs/README.md`: seção de specs de bounded context | B | P | Baixo |
| PLT-26 | `AGENTS.md` enxuto, só com o que é específico do repo | B | M | Médio |
| PLT-27 | Composite `docker-hub-mirror` (mirror.gcr.io) | B | P | Baixo |
| PLT-28 | `tasks.md`: armadilhas do generator `nx-go` e do default por executor | B | P | Baixo |
| PLT-29 | Bump do `dmpf-plugin` `1.0.0-rc.3` → `1.0.0-rc.7` | C | M | Médio |
| PLT-30 | Renovate: custom managers do toolchain Go e grupo `go-toolchain` | C | — | — |
| PLT-31 | Release groups Go e primeira release por família | C | — | — |

---

## Classe A: pode ir como está

### PLT-01: Biome respeitando o `.gitignore` e negações ancoradas na raiz

- **Classe:** A
- **Arquivos:** `biome.json` (plataforma) ↔ `biome.json` (template).
- **O que difere:**
  - A plataforma tem `"vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true }`.
  - Em `files.includes`, a plataforma ancora na raiz as negações de diretórios que só existem lá: `!.nx`, `!plans`, `!tmp`, `!pnpm-lock.yaml`, `!.agents`, `!.claude`, `!.cursor`, `!.gemini`, `!.github/skills`, `!.github/prompts`, `!.opencode`, `!.tokensave`, `!.remember`.
  - Mantém `**/` só no que aparece por projeto: `dist`, `out-tsc`, `test-output`, `coverage`, `node_modules` e `*.swcrc`.
  - O template usa `!**/tmp`, `!**/.claude`, `!**/.agents` etc.
- **Motivação/evidência:**
  - `38350134`: o Biome resolve os padrões contra o caminho absoluto, então `!**/.claude` casava um worktree sob `.claude/worktrees/` e `!**/tmp` casava um clone sob `/tmp`. O resultado era `Checked 0 files` com exit 1.
  - `cbc659bc`: sem o bloco `vcs`, o Biome processava artefato ignorado pelo git (`graphify-out/`, com 34 erros locais).
  - O template versiona `.claude/worktrees` no `.gitignore`, usa worktrees e ainda tem `!**/.claude`, então tem o mesmo defeito.
- **Recomendação:** acrescentar o bloco `vcs` e ancorar as negações de diretórios-raiz. Manter as exclusões próprias do template: `!dmpf.json`, `!dmpf.rendered.json`, `!infra`, `!tools/dmpf-baseline`. Conferir que o número de arquivos de `pnpm biome ci .` não muda num checkout limpo.
- **Esforço:** P
- **Risco:** baixo. Uma negação ancorada a mais pode deixar de excluir uma pasta homônima aninhada; conferir pela contagem de arquivos.

### PLT-02: Pre-push numa invocação, com base no que o remoto já tem

- **Classe:** A
- **Arquivos:** `lefthook.yml` (as duas pontas).
- **O que difere:**
  - O template roda quatro comandos `pnpm nx affected -t <x>` com a base default, o `defaultBase` `master`.
  - A plataforma roda um só comando:

    ```yaml
    affected:
      run: |
        base="$(git rev-parse --verify --quiet '@{push}' || git merge-base HEAD origin/develop)" || exit 1
        pnpm nx affected -t lint,typecheck,fmt-check,test --base="$base" --head=HEAD --parallel=3 --exclude=<raiz>
    ```

- **Motivação/evidência:**
  - `c440f2b8`: "Basear o pre-push no remoto e rodar o Nx uma vez só".
  - ADR-069, item 8: o pre-push levava de 6 a 12 min e o push por SSH caía por ociosidade.
  - No git-flow do template, a branch de trabalho nasce de `develop`. Com base em `master`, o `affected` inclui tudo o que ainda não foi liberado, e cada uma das quatro invocações recalcula o grafo.
- **Recomendação:** adotar o comando único com `--exclude=@nx-base-template/source`. Manter `build` na lista se o template quiser (a plataforma tirou só por causa do Docker) e incluir `fmt-check`, que é no-op sem projeto Go.
- **Esforço:** P
- **Risco:** baixo. A branch sem upstream depende de `origin/develop` estar atualizado.

### PLT-03: Pre-commit `gofmt -l` nos `.go` em stage

- **Classe:** A
- **Arquivos:** `lefthook.yml`.
- **O que existe:** o comando `gofmt` com `glob: "*.go"`, que guarda a saída e o status separados. Ele reprova tanto o arquivo fora do formato quanto o erro de sintaxe; um `test -z` daria sucesso com o arquivo que nem compila.
- **Motivação/evidência:** introduzido em `e5b37bd6` (ARQ-520), com a justificativa no próprio comentário do `lefthook.yml`.
- **Recomendação:** copiar como está. O template já tem `go.work`, e o hook só dispara quando há `.go` em stage.
- **Esforço:** P
- **Risco:** baixo. Exige o toolchain Go local para quem commita `.go`.

### PLT-04: Actions fixadas por SHA, runtime Node 24 e permissões por job

- **Classe:** A
- **Arquivos:**
  - `.github/workflows/*.yml` e `.github/actions/setup-node-pnpm/action.yml` (as duas pontas).
  - No template: `ci.yml`, `create-release.yml`, `nx-release.yml`, `publish-libs.yaml`, `detect-apps.yaml` e o composite.
- **O que difere:**
  - O template usa tags: `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, `docker/login-action@v3` e `nrwl/nx-set-shas@v5`.
  - A plataforma fixa por SHA com o comentário da versão, por exemplo `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0`, `pnpm/action-setup@fc06bc12… # v4.4.0`, `actions/setup-node@a0853c24… # v5.0.0` e `docker/login-action@dbcb8138… # v4`.
  - A plataforma também troca `permissions` de nível de workflow por permissões por job e usa `permissions: {}` no topo dos workflows novos.
- **Motivação/evidência:**
  - `1d4b97a0`: actions com `runs.using: node24` encerram o aviso de deprecação do Node 20.
  - `e1bc8f3b`: "Mover permissões para o job e fixar actions por SHA".
  - O template já estende `helpers:pinGitHubActionDigests` no Renovate, mas os workflows seguem com tags.
- **Recomendação:** subir para as versões Node 24, fixar por SHA e mover as permissões para os jobs. No `ci.yml`, o job `main` precisa de `packages: read`, por causa do plugin no GitHub Packages.
- **Esforço:** M (muitos arquivos, mudança mecânica).
- **Risco:** baixo.

### PLT-05: `nx-release`: `LEFTHOOK=0`, `pnpm --silent nx show` e input `version`

- **Classe:** A
- **Arquivos:** `.github/workflows/nx-release.yml` (as duas pontas).
- **O que difere:**
  1. A plataforma declara `env: LEFTHOOK: "0"` no job `version`. No template, o `pnpm install` roda o `prepare` (`lefthook install || true`), e o `git push --atomic` do job dispara o pre-push no runner.
  2. A plataforma usa `pnpm --silent nx show projects … --json` nos dois detectores. O template usa `pnpm nx show …`.
  3. A plataforma tem o input `version` no `workflow_dispatch`, validado por regex semver, para refazer uma release que falhou.
- **Motivação/evidência:**
  - `5eb79b33`: "Desligar o lefthook no job do Nx Release"; o pre-push abortava o push da release.
  - `ea6d8e92`: depois do `nx release`, o pnpm verifica as dependências e escreve no stdout, quebrando o JSON do `nx show` (run 37520617472).
- **Recomendação:** aplicar os três itens. São independentes de Go.
- **Esforço:** P
- **Risco:** baixo.

### PLT-06: Renovate: PR na `develop`, alertas de vulnerabilidade, `ignorePaths` e gomod indireto

- **Classe:** A
- **Arquivos:** `renovate.json` (as duas pontas).
- **O que difere:**
  - O template tem `"baseBranchPatterns": ["master"]`, contra o próprio git-flow.
  - A plataforma tem:
    - `"baseBranchPatterns": ["develop"]`;
    - `extends` com `:enableVulnerabilityAlerts`;
    - `"osvVulnerabilityAlerts": true`;
    - `ignorePaths` (`**/testdata/**`, `**/__fixtures__/**`, `**/examples/**` e outros);
    - duas regras gomod: dependência `indirect` consultada (`enabled: true`) e desligada para todo `matchUpdateTypes`, de modo que só o alerta de vulnerabilidade a sobe.
- **Motivação/evidência:** `4de6c9fa`, que diz: "apontava os PRs para a master, contra o fluxo, e não via o que reprovou o govulncheck … o x/net era indireto".
- **Recomendação:**
  - Copiar a base `develop`, os alertas OSV, o `ignorePaths` (sem `tools/dmpf-plugin/templates/**`) e as regras de gomod indireto.
  - Manter as regras do template que desligam `@mateusmacedo/dmpf-plugin`, `@nx-go/nx-go`, `github.com/mateusmacedo/dmpf{,/**}` e o workflow `mateusmacedo/dmpf`.
  - Os custom managers do Go ficam de fora: ver PLT-30.
- **Esforço:** P
- **Risco:** baixo.

### PLT-07: Skill `monitor-ci`: timeout em minutos, `--elapsed-seconds` e `limitReached`

- **Classe:** A
- **Arquivos:** `.agents/skills/monitor-ci/{SKILL.md,scripts/ci-poll-decide.mjs,scripts/ci-state-update.mjs}` e a cópia em `.github/skills/monitor-ci/` (as duas pontas).
- **O que difere:**
  - O `SKILL.md` do template documenta `--timeout 120` em minutos, mas passa `--timeout <timeout_seconds>` ao script, que compara em segundos. Na prática, o teto de 120 minutos vira 120 segundos.
  - A plataforma converte de minutos para segundos (`* 60`), acrescenta `--elapsed-seconds`, carregado entre tentativas, e o campo `limitReached` no retorno.
  - A plataforma usa `Number.parseInt`.
- **Motivação/evidência:**
  - `b8aab4e3`: "corrigir timeout do monitor-ci e sync de skills AI".
  - `70e81115`: `Number.parseInt`, achado do Sonar.
- **Recomendação:** aplicar o patch nas duas cópias.
- **Esforço:** P
- **Risco:** baixo. A skill vem do Nx (`configure-ai-agents`); uma regeneração futura pode sobrescrever o patch, e vale reportar o defeito upstream.

### PLT-08: Skills Go: testcontainers-go pela API `Run`

- **Classe:** A
- **Arquivos:** `.claude/skills/skill-go-testing/SKILL.md` e `.claude/skills/skill-unit-integration-testing/SKILL.md`.
- **O que difere:**
  - O template ensina `tcpostgres.RunContainer(ctx, testcontainers.WithImage(...))` e `t.Cleanup(pg.Terminate)`.
  - A plataforma usa `tcpostgres.Run(ctx, "postgres:16-alpine", …, tcpostgres.BasicWaitStrategies())` e `testcontainers.CleanupContainer(t, pg)`, com alias `tcpostgres`.
- **Motivação/evidência:** `ae4af737`. Desde a v0.32, `RunContainer` e `WithImage` estão deprecated.
- **Recomendação:** copiar os dois trechos. O WIP do template não cobre isso.
- **Esforço:** P
- **Risco:** baixo.

### PLT-09: `.nxignore` com `**/testdata/**`

- **Classe:** A
- **Arquivos:** `.nxignore` (só na plataforma).
- **O que existe:** um `.nxignore` com `**/testdata/**`. Sem ele, o `@nx-go/nx-go` infere como projeto Nx qualquer fixture com `go.mod` próprio, e o `nx affected` tenta rodar targets nela.
- **Motivação/evidência:** `d312594e`.
- **Recomendação:** criar o arquivo com o comentário. É preventivo: o template ainda não tem módulo Go, mas o primeiro bounded context pode trazer fixtures.
- **Esforço:** P
- **Risco:** baixo.

### PLT-10: Ignorados e extensões

- **Classe:** A
- **Arquivos:** `.gitignore`, `biome.json` e `.vscode/extensions.json`.
- **O que difere:**
  - O `.gitignore` da plataforma ignora `graphify-out/` e `.obsidian/`, e o Biome exclui `!.obsidian`. O template já ignora `plans`.
  - As extensões recomendadas incluem `golang.go`.
- **Motivação/evidência:** `58befca0` (`graphify-out/`), `3fb07400` (`.obsidian`) e `9f653951` (a extensão Go veio junto da depuração).
- **Recomendação:** acrescentar as duas entradas no `.gitignore`, `!.obsidian` no Biome (junto da PLT-01) e `golang.go` nas recomendações. As entradas de domínio ficam de fora (`zz_gate_*.go`, `.env.*__tmpl__`, `tb/dist`).
- **Esforço:** P
- **Risco:** baixo.

### PLT-11: Texto da release: PR pelo `GITHUB_TOKEN` e "depois do primeiro push com commits"

- **Classe:** A
- **Arquivos:** `.github/workflows/create-release.yml` (`::notice::` final), `CONTRIBUTING.md` e `docs/guides/development-workflow.md`.
- **O que difere:**
  - O template diz que "PR aberto pelo `GITHUB_TOKEN` não dispara o CI".
  - A plataforma corrige: o PR dispara execuções que o GitHub encerra sem nenhum job. Ela também orienta abrir o PR "depois do primeiro push com commits", porque a branch nasce igual a `master`.
- **Motivação/evidência:** `13f582cb` (remoção do `release-pr.yml`, que abria o PR pelo token) e `2fa633d1`.
- **Recomendação:** ajustar os três textos.
- **Esforço:** P
- **Risco:** baixo.

---

## Classe B: genérico, mas precisa de parametrização ou limpeza

### PLT-12: CI: check agregador `CI`, classificação do diff no lugar de `paths-ignore` e ruleset

- **Classe:** B
- **Arquivos:** `.github/workflows/ci.yml` (as duas pontas). O ruleset fica nas configurações do GitHub.
- **O que difere:**
  - O template filtra o gatilho com `paths-ignore: ["**/*.md", ".github/ISSUE_TEMPLATE/**"]` e tem dois jobs, `Nx Affected Pipeline` e `Template smoke (DMPF)`.
  - A plataforma não tem `paths-ignore`. Tem três peças:
    - **Job `Escopo`:** classifica o diff por `git diff --name-only "$BASE_SHA"...HEAD`. Vale como documentação `docs/**` e todo `*.md` fora de `tools/`, `.claude/` e `.agents/`, porque o markdown dessas pastas é saída do `init`.
    - **Jobs pesados:** rodam só com `code == 'true'`.
    - **Job `CI`:** `needs` de todos, com `if: always()` e
      `jq -e 'all(.[]; .result == "success" or .result == "skipped")'`. É o único check do ruleset: pulado conta como aprovado, e falha ou cancelamento reprova.
  - A plataforma declara `CI: "true"` no `env` do workflow.
- **Motivação/evidência:**
  - `830537cb`: com o `paths-ignore`, o PR só de Markdown nunca recebia o check obrigatório e ficava bloqueado.
  - `9d3100b3` e ADR-069, itens 4 e 6.
  - O `AGENTS.md` do template afirma que a `develop` "exige PR e o check do CI verde", mas a API não devolve ruleset nenhum (`rules/branches/develop → []`). Ao criar o ruleset, o defeito do `paths-ignore` aparece no primeiro PR de documentação.
- **Recomendação:**
  - Tirar o `paths-ignore`, criar o job de escopo com o mesmo critério (incluindo a exceção de `.claude/` e `.agents/`) e condicionar `main` e `template-smoke`.
  - Criar o job agregador `CI` e o ruleset da `develop`, que exige só `CI`.
  - Corrigir o `AGENTS.md`, ou registrar como criar os rulesets: o GitHub não copia ruleset para o repositório derivado de template.
  - Opcional: `biome ci --changed` quando a configuração do Biome não mudou.
- **Esforço:** M
- **Risco:** médio. O nome do check muda, e o ruleset precisa ser criado ou atualizado junto.

### PLT-13: `namedInputs`: tirar markdown, `package.json` e `Dockerfile` do hash

- **Classe:** B
- **Arquivos:** `nx.json` (as duas pontas).
- **O que difere:**
  - `default` ganhou `!{projectRoot}/**/README.md` e `!{projectRoot}/**/CHANGELOG.md`.
  - `go` ganhou `!{projectRoot}/**/*.md`, `!{projectRoot}/package.json` e `!{projectRoot}/Dockerfile`.
- **Motivação/evidência:**
  - `c1ce32f8`: "Tirar markdown, package.json e Dockerfile do cache".
  - O `CHANGELOG.md` e a versão no `package.json` que o `nx release` escreve invalidavam o cache de tudo.
- **Recomendação:**
  - Aplicar o bloco `go` como está. O `GO_NAMED_INPUT` do plugin (`init/generator.ts`) não tem essas exclusões, e o `mergeNxJson` só cria o input se faltar, então a edição manual persiste. Vale levar a mudança upstream para o plugin.
  - No `default`, excluir só o `CHANGELOG.md`. Libs TS com bundler `tsc` copiam `*.md` para o `dist` como asset, e tirar o `README.md` do hash publicaria README desatualizado.
- **Esforço:** P
- **Risco:** médio. Excluir input errado gera cache stale silencioso.

### PLT-14: `detect-apps` pelo grafo do Nx e `cd-dev-hmg` com `contains(fromJSON())`

- **Classe:** B
- **Arquivos:** `.github/workflows/detect-apps.yaml`, `.github/workflows/cd-dev-hmg.yml` e `docs/ci-cd/DEPLOY_APPLICATIONS.md`.
- **O que difere:**
  - O template calcula o diff à mão contra `github.event.before` e procura `<app_dirs>/<pasta>/<marker>`, com `app_dirs: apps`. No layout `apps/backend/<app>`, que o próprio template usa, o resultado é sempre `[]`.
  - O exemplo do job `deploy-<app>` usa `contains(needs.detect.outputs.apps, 'apps/<app>')`, que casa por substring: `apps/foo` casa `apps/foo-bar`.
  - A plataforma:
    - faz setup de Node e pnpm;
    - roda `nrwl/nx-set-shas` com `main-branch-name: ${{ github.ref_name }}` e `last-successful-event: ${{ github.event_name }}`;
    - lê `pnpm --silent nx show projects --affected --type app --json` e filtra o `root` que tem o `marker_file`;
    - remove os inputs `app_dirs` e `shared_dirs`;
    - pede `actions: read`;
    - usa no exemplo `contains(fromJSON(needs.detect.outputs.apps || '[]'), 'apps/backend/<app>')`.
- **Motivação/evidência:** `73a3d441` e ADR-071, item 7. Além disso, a app cujo deploy falhou volta à fila, porque a base é o último run verde.
- **Recomendação:**
  - Portar o detect pelo grafo. O composite do template exige `NODE_AUTH_TOKEN` para instalar o plugin, então o job precisa de `packages: read` e do env.
  - Atualizar o exemplo comentado do `cd-dev-hmg.yml` e o doc.
  - Manter a menção a `deploy-eks.yaml` local, como o template já faz.
- **Esforço:** M
- **Risco:** médio. O CD está desligado no template, então o impacto é só sobre quem o ligar.

### PLT-15: `@nx/docker`: `docker:build` a partir da raiz do monorepo

- **Classe:** B
- **Arquivos:** `nx.json` (`plugins[@nx/docker].options`).
- **O que difere:**
  - A plataforma declara `buildTarget: { name: "docker:build", cwd: ".", args: ["-f {projectRoot}/Dockerfile"] }`.
  - O template não declara nada, e o build roda com o contexto na pasta do projeto. Isso contradiz o `infra/docker/Dockerfile.node.example` do próprio template, que exige o contexto na raiz.
- **Motivação/evidência:** `0f627bea`: "Gerar em ./... e construir as imagens a partir da raiz".
- **Recomendação:**
  - Adotar o `cwd` e o `-f`.
  - Acrescentar os `--secret` que o Dockerfile de referência pede: `id=npmrc` e `id=NODE_AUTH_TOKEN`.
  - Não copiar o `runTarget` da plataforma (`--network host --env-file deploy/.env`) nem o `targetDefaults["docker:run"]`, que aponta para `bff:infra-up`. Os dois são da plataforma.
- **Esforço:** P
- **Risco:** médio. Validar com a primeira app Node.

### PLT-16: Nx Cloud: `nxCloudId` herdado pelos derivados e token ausente no CI

- **Classe:** B
- **Arquivos:** `nx.json` e `.github/workflows/ci.yml`.
- **O que difere:**
  - O template tem `"nxCloudId": "6a5d373ddbc8c8c89a15bb24"` e não passa `NX_CLOUD_ACCESS_TOKEN` em workflow nenhum.
  - A plataforma nasceu do template com o mesmo ID. Ela trocou o ID por `neverConnectToCloud: true` (`9324c8d6`) e depois criou um workspace próprio, o `6ad65261…` (`68149074`).
  - O CI da plataforma passa o secret `NX_CLOUD_ACCESS_TOKEN`. O ADR-069, item 9, explica: sem o cache remoto, nenhuma execução reaproveitava outra.
- **Motivação/evidência:**
  - Todo projeto derivado do template compartilha o workspace e o cache do Nx Cloud do template até alguém trocar o ID.
  - O CI do template não autentica.
- **Recomendação:**
  - Decidir a política e documentá-la no `AGENTS.md` e no `docs/onboarding.md`. Há dois caminhos:
    - no template, `neverConnectToCloud: true`, com a instrução `pnpm nx connect` no derivado;
    - manter o ID e documentar a troca obrigatória ao derivar.
  - Ligar o secret `NX_CLOUD_ACCESS_TOKEN` no `ci.yml`.
- **Esforço:** P
- **Risco:** médio. Envolve isolamento de cache entre repositórios.

### PLT-17: Semente de cache (pnpm) em `develop` e `master`

- **Classe:** B
- **Arquivos:** `.github/workflows/cache-seed.yml` (só na plataforma, focado em Go).
- **O que existe:** um workflow que roda em `push` para `develop` e `master` (com filtro de paths), toda semana e sob demanda. Ele grava o cache que os PRs leem da branch base. O comentário do arquivo explica: "o PR só lê o cache da própria ref, da branch base e da default; sem semente … cada PR pagava o cache frio".
- **Motivação/evidência:** `2ee91742` e ADR-069, item 9.
  - No template, o `ci.yml` só roda em `pull_request`, e o `setup-node` com `cache: pnpm` grava na ref do PR.
  - A `master` só recebe cache no `nx-release`.
  - A `develop` nunca recebe cache. Com o lockfile da `develop` diferente do da `master`, todo PR novo parte do cache frio.
- **Recomendação:**
  - Criar o equivalente para o store do pnpm: `push` em `develop` e `master` filtrado por `pnpm-lock.yaml`, `pnpm-workspace.yaml` e `package.json`, `schedule` semanal e `workflow_dispatch`, rodando o composite `setup-node-pnpm`.
  - A parte de Go fica para quando houver módulo; ela chega pelo reutilizável, ver PLT-29.
- **Esforço:** P
- **Risco:** baixo.

### PLT-18: Pré-release `release/X.Y.Z-<pre>` e dist-tag `next`

- **Classe:** B
- **Arquivos:** `.github/workflows/nx-release.yml` e `CONTRIBUTING.md` (seção "Pré-release").
- **O que existe:**
  - Quando o head do PR casa `^release/([0-9]+\.[0-9]+\.[0-9]+-[0-9A-Za-z.-]+)$`, o workflow roda `nx release <versão>` com a versão explícita para todos os projetos.
  - O output `dist_tag` vale `next` quando alguma versão npm criada tem `-`, e `latest` nos demais casos. O job `publish` passa `tag: ${{ needs.version.outputs.dist_tag }}`.
  - O `CONTRIBUTING.md` documenta o fluxo: a branch de pré-release é criada à mão, e um job que falhou é refeito por dispatch com `version`.
- **Motivação/evidência:**
  - `6ff2de0a`: "Fixar a versão de todos os projetos na pré-release".
  - O template publica sempre com `tag: latest`, então uma pré-release viraria a `latest` no GitHub Packages.
- **Recomendação:**
  - Portar a resolução de versão (pré-release, `version` manual) e o `dist_tag`.
  - Não copiar o que é da plataforma: `sync-versions.mjs`, `versions.json`, o filtro `dmpf@*`, a versão fixa `0.1.0` da estreia e o job `consumer`.
  - Acrescentar a seção "Pré-release" no `CONTRIBUTING.md`, sem o parágrafo de `go.mod`/`modsync`.
- **Esforço:** M
- **Risco:** médio. Mexe no caminho de release, então convém validar num fork.

### PLT-19: Workflow agendado para gates que reprovam sem diff

- **Classe:** B
- **Arquivos:**
  - Plataforma: `.github/workflows/govulncheck.yml` e `docs/guides/dmpf-consumo-externo.md`, §5 "Gates agendados".
  - No template não há equivalente.
- **O que existe:**
  - A plataforma roda diariamente, às 09:00 UTC, o `govulncheck` de todos os projetos Go e o `conformance` global na `develop`.
  - O guia do consumidor traz pronto um `.github/workflows/dmpf-agendado.yml`. Ele não pode reusar o `dmpf-go-ci.yml`, porque o escopo, sem diff, sai vazio.
- **Motivação/evidência:**
  - `408bb493`: a vulnerabilidade apareceu depois do merge, e a release `1.0.0-rc.2` saiu de um commit que o CI reprovou em seguida.
  - ADR-071, item 4.
- **Recomendação:**
  - Adicionar o workflow do guia, com `if: hashFiles('**/go.mod') != ''` (ou um passo que pula sem módulo Go). Sem isso, o template fica vermelho, como já acontece com o `dmpf-ci.yml` (ADR-011).
  - Avaliar um job análogo de `pnpm audit` para o lado npm.
- **Esforço:** P
- **Risco:** médio. Sem a guarda, o workflow nasce vermelho no template.

### PLT-20: `tools/adr-verify.mjs`, verificador do acervo de ADRs

- **Classe:** B
- **Arquivos:** `tools/adr-verify.mjs` (686 linhas) e `tools/tests/adr-verify/{fixture.mjs,verify.test.mjs}`, só na plataforma.
- **O que existe:** um verificador com oito checagens derivadas de `docs/adr/README.md`:
  - **A1:** bijeção arquivo ↔ heading;
  - **A2:** arquivo ↔ índice;
  - **A3:** numeração contínua;
  - **A4:** seções na ordem canônica e `## Addendum` único no fim;
  - **A5:** tabela de alternativas, Positivas/Negativas e custo aceito;
  - **A6:** pendência com owner e prazo;
  - **A7:** sem referência por número de linha;
  - **A8:** spec de origem existente.

  O verificador aceita `--from` e `--to` para adoção por faixa e `--json`. O harness tem 54 testes.
- **Motivação/evidência:** `dd35d594` (ARQ-448), em que o `docs/adr/` podia divergir do próprio guia com o gate verde, e `03f6be2a` (regex sem backtracking). O template usa o mesmo template de ADR, com `Status`, `Contexto`, `Decisão`, `Alternativas descartadas`, `Consequências` e `Addendum`.
- **Recomendação:**
  - Portar o script e o harness, removendo o cabeçalho que cita a spec de origem da plataforma (contrato do acervo de ADRs mínimos) e o texto sobre as séries de ADR da plataforma.
  - Conferir o nome da seção do índice (`Decisões registradas`).
  - Ligar no CI pelo critério de escopo da PLT-12 (`docs/adr/**`, `tools/adr-verify.mjs`) e documentar a checagem A4 no `docs/adr/README.md`.
- **Esforço:** M
- **Risco:** baixo. O ADR atual do template pode reprovar em A5 ou A6 na primeira passada; usar `--from` se for preciso.

### PLT-21: Rule `language-review.md` e `agent-organizer` com `skills:`

- **Classe:** B
- **Arquivos:** `.claude/rules/language-review.md` (só na plataforma), `.claude/agents/agent-organizer.md` e `.claude/README.md`.
- **O que existe:**
  - Uma rule que manda revisar a prosa PT-BR e EN uma vez, ao final da entrega, com um `pt-reviewer` e um `en-reviewer` em paralelo sobre o conjunto, e não a cada `Write`/`Edit`.
  - O `agent-organizer` ganhou `skills:` (12 skills) e mais ferramentas: `Skill`, `AskUserQuestion`, `Bash`, `LSP`, `MCPSearch`, `Task`, `WebFetch` e `WebSearch`.
- **Motivação/evidência:** `495e5b1e` (ARQ-546). Um revisor por arquivo multiplica latência e tokens.
- **Recomendação:**
  - Portar a rule, alinhando o gatilho ao que vale hoje no ambiente do mantenedor: uma vez, antes da abertura do PR, opcional.
  - Revisar a lista de ferramentas do `agent-organizer`: `MCPSearch` é nome de ferramenta e precisa existir no ambiente.
  - O `model: opus` dos agentes já está coberto pelo WIP do template.
- **Esforço:** P
- **Risco:** baixo.

### PLT-22: `comment-discipline.md` mais estrita e `process-enforcement.md` enxuta

- **Classe:** B
- **Arquivos:** `.claude/rules/comment-discipline.md` (94 linhas no template, 136 na plataforma) e `.claude/rules/process-enforcement.md`.
- **O que difere:**
  - A plataforma reescreveu a disciplina de comentários com o default "zero comentários". Ela traz uma "única porta de entrada" (código não revelador **e** complexidade cognitiva alta) e proíbe o preâmbulo em todo símbolo e a narração dentro do corpo.
  - O `process-enforcement.md` perdeu as seções "Reutilização" e "Go: processo e cadeia de validação", redundantes com outras rules e skills.
- **Motivação/evidência:** `042eaa6f` e `71c07e02`.
- **Recomendação:** adotar a versão estrita, se o template quiser essa política; ela é opinativa. A remoção das seções redundantes pode ir como está.
- **Esforço:** P
- **Risco:** baixo.

### PLT-23: Notas "Override DMPF" nas skills e rules genéricas de Go

- **Classe:** B
- **Arquivos:**
  - `.claude/skills/{skill-go,skill-go-testing,skill-go-db-patterns,skill-go-http-patterns}/SKILL.md`;
  - `.claude/rules/{file-organization,testing-conventions}.md`.
- **O que existe:** um bloco `> **Override DMPF.** Num bounded context deste workspace, a forma é a de .claude/rules/dmpf-bounded-context.md … e prevalece sobre o genérico`. O bloco evita que as skills genéricas de Go, com layout `internal/` e testcontainers, contradigam a forma DMPF.
- **Motivação/evidência:** `fecc6b6d`.
- **Recomendação:**
  - Portar as notas, apontando só para a `.claude/rules/dmpf-bounded-context.md`, que o template já recebe do plugin.
  - Tirar as citações ao `apps/backend/bookings` e ao ADR-053 da plataforma, ou trocá-las pelo guia `docs/guides/primeiro-bounded-context.md`.
- **Esforço:** P
- **Risco:** baixo.

### PLT-24: Docs: "Esteira de CI por etapa" e docs de contribuição alinhados

- **Classe:** B
- **Arquivos:** `docs/ci-cd/README.md`, `CONTRIBUTING.md`, `docs/onboarding.md` e `docs/guides/development-workflow.md`.
- **O que existe:**
  - Uma tabela por etapa: `pre-commit`, `pre-push`, PR para `develop`/`release/**`, PR só de documentação, PR para `master`, `push` em `master`, agendado e semente de cache.
  - Um parágrafo sobre o check único `CI` e o Nx Cloud.
  - Os guias descrevem o pre-push com base no remoto.
- **Motivação/evidência:** `55c30731`, `7458883b` e ADR-069 (a tabela vive no `docs/ci-cd/README.md`).
- **Recomendação:** escrever a versão do template junto com as PLT-02, PLT-12, PLT-16, PLT-17 e PLT-19, sem as linhas de DMPF, consumidor externo, distribuído e Sonar. Hoje os docs do template ainda descrevem o `paths-ignore`.
- **Esforço:** M
- **Risco:** baixo.

### PLT-25: `docs/specs/README.md`: seção de specs de bounded context

- **Classe:** B
- **Arquivos:** `docs/specs/README.md`.
- **O que existe:** a seção "Specs de bounded context".
  - A spec de modelo segue o template guardado na skill: `.agents/skills/dmpf-bounded-context/references/template-bounded-context.md`.
  - Ela usa o frontmatter comum, o título `Bounded context — …` e dez seções fixas.
  - O comando `/dmpf-new-context SPEC-<id>` valida a spec.
- **Motivação/evidência:** presente desde `a46534eb`. O template já recebe a skill e o comando pelo plugin, mas os docs não explicam o caminho por spec. O `primeiro-bounded-context.md` só cobre o generator direto.
- **Recomendação:** portar a seção, trocando o exemplo da spec golden do `bookings` da plataforma por uma referência neutra, e citá-la no guia `primeiro-bounded-context.md`.
- **Esforço:** P
- **Risco:** baixo.

### PLT-26: `AGENTS.md` enxuto, só com o que é específico do repo

- **Classe:** B
- **Arquivos:** `AGENTS.md` (388 linhas no template, 119 na plataforma).
- **O que difere:** a plataforma reduziu o arquivo ao que não vive em outro lugar: regras duras mínimas, visão geral, convenções obrigatórias, comandos, git/release e referências. Conduta, git, refatoração e testes passaram a viver em `.claude/rules/`, e o detalhe por módulo, nos `README.md`.
- **Motivação/evidência:** `66f40e9b` (+38/−421): "Enxugar o AGENTS.md removendo o conteúdo redundante".
- **Recomendação:**
  - Avaliar o mesmo corte. O `AGENTS.md` do template é a fonte que os derivados herdam, então cortar exige garantir que cada regra removida existe numa rule.
  - Aproveitar para corrigir a afirmação sobre os rulesets (ver PLT-12).
- **Esforço:** M
- **Risco:** médio. Instrução que só existia no `AGENTS.md` pode se perder.

### PLT-27: Composite `docker-hub-mirror` (mirror.gcr.io)

- **Classe:** B
- **Arquivos:** `.github/actions/docker-hub-mirror/action.yml` (só na plataforma).
- **O que existe:** um composite que acrescenta `"registry-mirrors": ["https://mirror.gcr.io"]` ao `/etc/docker/daemon.json` e reinicia o daemon. O Docker Hub continua como fallback.
- **Motivação/evidência:** `b8e3a3c8`. Os jobs reprovavam no limite de pull anônimo do Docker Hub.
- **Recomendação:** trazer quando o CI do template passar a puxar imagens do Docker Hub (e2e com compose, testes de integração TS). Hoje só o reutilizável do DMPF puxa imagens, e ele já tem a action (C).
- **Esforço:** P
- **Risco:** baixo.

### PLT-28: `tasks.md`: armadilhas do generator `nx-go` e do default por executor

- **Classe:** B
- **Arquivos:** `docs/nx-reference/tasks.md`.
- **O que existe:**
  - `--skipFormat` é obrigatório no `@nx-go/nx-go:library`. Sem ele, o `formatFiles()` roda o Prettier com largura 80 sobre o `nx.json`, e o `biome ci` reprova.
  - O default por executor (`@nx-go/nx-go:test`) substitui o default por nome, então é preciso repetir `dependsOn` e `cache`.
  - O generator não ajusta o module path, o `package.json` privado nem os targets que o plugin não infere.
- **Motivação/evidência:** `5a97726d` e as seções "Lib Go" e "A quarta tag" da plataforma.
- **Recomendação:** portar as duas armadilhas genéricas. O resto da seção "Lib Go" é da plataforma (kernel, `dmpf-units.json`).
- **Esforço:** P
- **Risco:** baixo.

---

## Classe C: chega via bump ou ferramenta, não copiar à mão

### PLT-29: Bump do `@mateusmacedo/dmpf-plugin` `1.0.0-rc.3` → `1.0.0-rc.7`

- **Classe:** C
- **Arquivos afetados no template:**
  - `pnpm-workspace.yaml` (catalog e `minimumReleaseAgeExclude`);
  - `nx.json` (pin do golangci-lint `v2.13.2` → `v2.15.0` no `@nx-go/nx-go:lint`);
  - `go.work` (`go 1.26.9` → `1.26.10`);
  - `.golangci.yml` (regras IDN-14 do `forbidigo` com `text`, depguard `testkit`);
  - `.env.example` (Redis de revogação e variáveis do Keycloak);
  - ativos de IA (`.agents/skills/dmpf-*`, `.claude/{agents,commands,rules}/dmpf-*`);
  - `.github/workflows/dmpf-ci.yml` (só o `workflowRef` e `plugin-version` mudam).
- **O que chega:**
  - O reutilizável `dmpf-go-ci.yml` novo traz o job único `DMPF` por escopo do diff (`dmpf-scope`), o input `govulncheck`, os vetores negativos em job próprio, o secret opcional `NX_CLOUD_ACCESS_TOKEN` e as composites `setup-go` (cache com `restore-keys` e aquecimento), `dmpf-layout` e `docker-hub-mirror`.
  - As migrations `sync-init` e `update-versions` (rc.7) cuidam disso, e o `pnpm nx migrate @mateusmacedo/dmpf-plugin@1.0.0-rc.7` faz o caminho.
- **Motivação/evidência:**
  - As tags `@mateusmacedo/dmpf-plugin@1.0.0-rc.6` e `@1.0.0-rc.7` existem.
  - `tools/dmpf-plugin/migrations.json` (rc.7) e `versions.json`.
  - `383e9e54` (golangci v2.15.0), ADR-069 e ADR-071.
- **Recomendação:**
  - Rodar o migrate e, depois, o `infrasync --write` que o guia `dmpf-consumo-externo.md` §6 manda.
  - Não aplicar à mão nenhuma das diferenças acima.
  - O `GO_NAMED_INPUT` e o `.nxignore` não chegam pelo plugin: ver PLT-13 e PLT-09.
- **Esforço:** M
- **Risco:** médio. O passo do `infrasync` é manual.

### PLT-30: Renovate: custom managers do toolchain Go e grupo `go-toolchain`

- **Classe:** C
- **Arquivos:** `renovate.json` da plataforma: regex managers para `go.work` e `tools/dmpf-plugin/versions.json`, e as regras `go-toolchain`.
- **Motivação/evidência:** `4de6c9fa`.
- **Recomendação:** não copiar. No template, a diretiva do `go.work` e os pins vêm da migration `update-versions` do plugin. Um bump pelo Renovate brigaria com o `nx migrate`, e o template já desliga o Renovate para o plugin e o `@nx-go/nx-go`.

### PLT-31: Release groups Go e primeira release por família

- **Classe:** C
- **Arquivos:** `nx.json` `release.groups` (`go-libs`, `go-contract-*`, `go-tools` e `npm`) e o passo "Nx Release" da plataforma, que detecta a primeira release pelos padrões de tag de cada família.
- **Motivação/evidência:** `4cc0422d`, `cab6692a` e `b8f0816b`.
- **Recomendação:** não copiar. O template documenta que os grupos nascem com o primeiro membro, e o `bounded-context` grava `go-contract-<ctx>`. Quando o template tiver o primeiro grupo, rever a detecção de primeira release, que hoje usa `git tag -l '*@*'`.

---

## Classe D: específico da plataforma, não levar

- código do kernel, do `dmpf-plugin` e do `dmpf-conformance`;
- `dmpf-go-ci.yml`, `dmpf-distributed.yml`, `dmpf-verify.yml`, `load.yml` (k6), `sonar.yml` com `sonar-project.properties`, e o `govulncheck.yml` e o `cache-seed.yml` na forma Go da plataforma;
- as actions `dmpf-scope`, `dmpf-layout` e `setup-go`, que chegam pelo reutilizável;
- os scripts `external-consumer.sh`, `kernel-file-proxy.sh`, `infra-budget.sh`, `infra-session.sh`, `otel-env-check.sh`, `grafana-provisioning-check.sh` e `dmpf-*-check.sh`, e `tools/tests` (exceto o `adr-verify`);
- o `.vscode/launch.json` e o `tasks.json` (dlv das apps);
- o CODEOWNERS por contrato;
- no `.gitignore`: `zz_gate_*.go`, `.env.*__tmpl__` e `tb/dist`;
- no `nx.json`: o `docker:run` (`--network host`, `bff:infra-up`);
- `@nx/devkit` e `@nx/plugin` no catalog, e a referência `tools/dmpf-plugin` no `tsconfig.json`;
- o `sandbox.network.allowedDomains` do `.claude/settings.json`;
- `docs/dmpf`, as ADRs 010–071 e as specs de domínio;
- a remoção do `normalize-pruned-manifest.mjs`, que o `Dockerfile.node.example` do template usa.

## Onde o template já está à frente (não regredir)

- O composite `setup-node-pnpm` do template escreve a credencial do GitHub Packages no `.npmrc` de usuário e tem o input `install`.
- O `publish-libs.yaml` do template passa os inputs por `env`. A plataforma interpola `${{ inputs.* }}` dentro do `run`, o que abre vetor de injeção.
- O `pnpm-workspace.yaml` do template tem `fetchRetries` e `fetchRetryMintimeout`.
- O `create-release.yml` do template é equivalente ao da plataforma (só o texto do aviso difere: PLT-11).
- O `docs/ci-cd/` do template não depende do `actions-templates` externo, que a plataforma ainda cita.

## Cobertura pelo WIP do template

- **Coberto:** o `model: sonnet → opus` nos `.claude/agents/*.md`, que a plataforma também usa (`9613b0cc`, `c44ddb84`, `96d36bc6`).
- **Não cobertos:**
  - o resto do diff dos agentes, que é formatação de markdown (linhas em branco, separadores de tabela `| --- |`);
  - o `skills:` do `agent-organizer` (PLT-21);
  - as notas de override (PLT-23);
  - a API `Run` (PLT-08).
- Nenhum achado depende do `tsconfig.base.json`, que está deletado no WIP.
