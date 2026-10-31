# Delta de engenharia do antecipa-market em relação ao nx-base-template

Escopo: o que o `antecipa-market` recebeu depois do commit inicial `cf5497c` (árvore idêntica ao HEAD `980c3aa` do template) e que pode voltar para o template. Somente leitura nos dois repositórios.

## Resumo executivo

- 73 commits no intervalo `cf5497c..HEAD`. Fora de `apps/`, `libs/`, dos planos e das docs de produto, são 104 arquivos tocados (75 mil linhas, das quais cerca de 68 mil são os bundles do `.obsidian/`).
- A maior parte do delta de engenharia é saída do `@mateusmacedo/dmpf-plugin` (classe C). Prova: dos 80 arquivos listados em `dmpf.rendered.json` do antecipa-market, 0 divergem do hash registrado, ou seja, nenhum arquivo gerenciado foi editado à mão. Comparando com os `templates/` do plugin `1.0.0-rc.7` instalado no antecipa-market, as únicas diferenças são placeholders EJS (`modulePrefix`, `edge`, `composeProfile`, `composeProject`).
- Os 51 arquivos de `.claude/agents` e `.claude/skills` (troca `model: sonnet` por `model: opus`, lista de skills do `golang-pro`, newline final) já estão 100% cobertos pelo WIP do template: `diff -rq` entre `nx-base-template/.claude/{agents,skills}` (working tree) e `antecipa-market/.claude/{agents,skills}` (HEAD) só acusa diferença em `.claude/agents/dmpf-context-author.md`, que é saída do plugin.
- Os 67 arquivos gerenciados do template (`dmpf.rendered.json`) também estão com hash íntegro. Logo o `sync-init` do rc.7 consegue reescrevê-los sem `--force`.
- Achados genuinamente novos (não vêm do plugin): `.gitignore` sem liberar `.env.*.example` (ANT-01), `@nx/docker` sem contexto na raiz (ANT-02), passos manuais do bump (ANT-07), overlays raiz do k8s portados do platform (ANT-08), `template-smoke` quebrando em derivado (ANT-10).
- `@mateusmacedo/dmpf-plugin@1.0.0-rc.7` é a última tag do platform (`/home/mateus/work/Projects/lidercap/lidercap-platform`, HEAD `7e74b6ff` com 9 commits depois da tag, nenhum publicado).

## Metodologia e verificações

```bash
A=/home/mateus/work/Projects/lidercap/antecipa-market
git -C $A log --format='%h %ad %s' --date=short cf5497c..HEAD
git -C $A diff cf5497c HEAD -- <paths>
diff -rq nx-base-template/.claude/agents antecipa-market/.claude/agents   # só dmpf-context-author.md difere
# hash de cada arquivo de dmpf.rendered.json contra o arquivo em disco: 80/80 ok (antecipa), 67/67 ok (template)
# templates do plugin rc.7 (node_modules/@mateusmacedo/dmpf-plugin/templates) contra os arquivos do antecipa: só placeholders EJS diferem
```

Evidências adicionais:

- `node_modules/@mateusmacedo/dmpf-plugin/migrations.json` (rc.7): `sync-init` ("Reaplica os templates do init ... sem sobrescrever arquivo editado") e `update-versions` ("Sobe o require do kernel nos go.mod, os pins de govulncheck, golangci-lint e @nx-go/nx-go e a diretiva do go.work"). Só há entradas com `version: 1.0.0-rc.7`, então o salto rc.3 para rc.7 roda cada migration uma vez.
- `versions.json` rc.7: go `1.26.10`, golangciLint `v2.15.0`, workflowRef `ddd3d0c4202879f168c7f6bfafaefadd94a3a621`, kernel e conformance `v1.0.0-rc.7`.
- O `tools/template-smoke.sh` do template lê as versões de `node_modules/@mateusmacedo/dmpf-plugin/versions.json`, então não tem pin de versão para atualizar.

Linha do tempo do plugin no antecipa-market: rc.3 (herdado) para rc.4 em `b5bb591` (12/10), rc.5 em `b297d0c` (17/10), rc.7 em `9509bb3` (21/10). O rc.4 foi aplicado antes do `init` com prefixo real e a mensagem registra "O template-smoke passou contra o kernel e o conformance v1.0.0-rc.4": o salto rc.3 para rc.4 foi validado exatamente nas condições do template. Rc.5 e rc.7 foram aplicados depois de `48fdda6` (que removeu o smoke), portanto não têm essa prova.

---

## Achados A e B (levar para o template)

### ANT-01 | Classe A | `.gitignore` não libera `.env.*.example`

- Arquivos: `.gitignore` (template e antecipa-market).
- O que mudou no antecipa-market: acrescentou `!.env.session-events.example` depois de `!.env.example`, em `c12d3ef` ("declara o bff como borda do DMPF"), porque o `bff` gerou `deploy/.env.session-events.example` e o padrão `.env.*` o ignorava.
- Evidência de que o problema é maior que o do antecipa-market:
  - O `.gitignore` do platform (`lidercap-platform/.gitignore`, linhas 64 a 71) libera `!.env.example`, `!.env.migrator.example` e `!.env.session-events.example` (mais as variantes `__tmpl__`).
  - O gerador `bounded-context` do rc.7 emite `deploy/.env.migrator.example` (`templates/bounded-context/deploy/.env.migrator.example__tmpl__`) e o target `serve-api` o carrega (`generator.js:104`).
  - No antecipa-market, `apps/backend/partner/project.json` (linha 75) e `partner/README.md` (linha 93) referenciam `deploy/.env.migrator.example`, mas o arquivo não está versionado nem existe em disco. `git check-ignore -v apps/backend/partner/deploy/.env.migrator.example` aponta `.gitignore:64:.env.*`. É um defeito latente que o derivado ainda não percebeu.
  - O `.gitignore` do template tem só `.env`, `.env.*`, `!.env.example`, então qualquer contexto gerado após o bump para rc.7 perderia esse arquivo no commit.
- Recomendação: no `.gitignore` do template, depois de `!.env.example`, acrescentar:

```text
!.env.*.example
```

  (`.env.example` não casa com esse glob, por isso `!.env.example` continua necessário.) Alternativa estrita, igual à do platform: `!.env.migrator.example` e `!.env.session-events.example`.
- Esforço: P. Risco: baixo (libera só arquivos de exemplo; vale conferir que nenhum `.env.*.example` do repositório carrega segredo real).
- Aviso: o antecipa-market deve receber a mesma correção (`!.env.migrator.example`), fora do escopo deste relatório.

### ANT-02 | Classe B | `nx.json`: `@nx/docker` com contexto de build na raiz

- Arquivos: `nx.json`.
- O que mudou (`7bd0f28`, "constrói as imagens Docker a partir da raiz"):

```diff
       "plugin": "@nx/docker",
       "options": {
         "buildTarget": {
-          "name": "docker:build"
+          "name": "docker:build",
+          "cwd": ".",
+          "args": ["-f {projectRoot}/Dockerfile"]
         },
         "runTarget": {
-          "name": "docker:run"
+          "name": "docker:run",
+          "args": ["--rm", "--name {projectName}", "--network host", "--env-file deploy/.env"]
         }
```

- Motivação: a mensagem do commit diz que o `docker:build` inferido rodava no diretório do projeto e o `COPY go.work` ficava fora do contexto; "alinha o plugin @nx/docker ao da referência do kernel". Confirmado: o `nx.json` do platform tem exatamente esse bloco.
- Por que serve ao template: o próprio `infra/docker/Dockerfile.node.example` do template manda construir "a partir da RAIZ do repositório" e `docs/ci-cd/DEPLOY_APPLICATIONS.md` (item 1) exige "contexto na raiz do monorepo". O default do `@nx/docker` é `cwd = projectRoot` (conferido em `node_modules/@nx/docker/dist/src/plugins/plugin.js`, linha 92; `DockerTargetOptions` aceita `cwd` e `args`). Logo o `docker:build` inferido do template só funciona se o Dockerfile não precisar do contexto raiz, o que contradiz a convenção do template.
- Recomendação: levar só o `buildTarget` (`cwd: "."` e `args: ["-f {projectRoot}/Dockerfile"]`). No `runTarget`, `--rm --name {projectName}` é genérico, mas `--network host --env-file deploy/.env` é convenção DMPF/Go (o `deploy/.env` não existe em app Node); deixar fora ou condicionar. O gerador `bounded-context` já escreve o próprio `docker:run` no `project.json` de cada contexto, então o `runTarget` do `nx.json` não é necessário para Go.
- Esforço: P. Risco: baixo a médio (confirmar que o `nx release` com Docker, quando houver `type:app` Node, continua resolvendo o Dockerfile e a tag; testar com o `apps/backend/playground` ou numa app nova).

### ANT-10 | Classe B | `template-smoke` falha sempre em projeto derivado

- Arquivos: `.github/workflows/ci.yml` (job `template-smoke`), `tools/template-smoke.sh`, e as referências em `README.md`, `AGENTS.md`, `docs/ci-cd/README.md`, `docs/guides/primeiro-bounded-context.md`.
- O que o antecipa-market fez (`48fdda6`, "remove o smoke do template do projeto derivado"): removeu o job, o script e as menções. Motivo registrado: "O template-smoke exige o modulePrefix reservado no dmpf.json, que o init com o prefixo real substitui; num projeto derivado ele sempre falha" (o script recusa o prefixo real: `tools/template-smoke.sh` linha 63 espera o erro `reserved modulePrefix`).
- A remoção em si é específica do derivado (classe D). O achado genérico é que o template não documenta nem automatiza esse passo: `docs/onboarding.md` não menciona o smoke; o derivado descobre quando o CI quebra.
- Recomendação (escolher uma):
  1. Condicionar o job: um primeiro step lê `jq -r .modulePrefix dmpf.json` e pula o resto quando for diferente do reservado `example.com/change-me`. Assim o derivado herda o `ci.yml` sem editar.
  2. Só documentar, em `docs/onboarding.md` e em `docs/guides/primeiro-bounded-context.md`, o checklist "ao derivar: remover o job `template-smoke`, `tools/template-smoke.sh` e as menções em README e AGENTS".
- Esforço: P (documentar) ou M (condicionar). Risco: baixo.

### ANT-08 | Classe B (opcional) | Overlays raiz do Kubernetes `dev` e `hmg`

- Arquivos novos no antecipa-market: `infra/k8s/overlays/dev/kustomization.yaml`, `dev/redis-users.acl`, `infra/k8s/overlays/hmg/kustomization.yaml`, `hmg/otel-collector-patch.yaml`, `hmg/otel-collector-tls.yaml`, `hmg/secrets.example.yaml.tmpl`.
- Origem: `c12d3ef` ("Roda o init --edge=bff ... e porta o overlay de plataforma de dev e hmg"). Não são saída do plugin (nenhum deles tem template em `templates/init/`); são portados à mão do platform (`lidercap-platform/infra/k8s/overlays`). O diff contra o platform mostra só cabeçalhos de comentário reduzidos (`4c22431`, "enxuga os cabeçalhos dos overlays de plataforma") e, no hmg, o `configMapGenerator` do Keycloak apontando para `bff-session-events`.
- Situação no template: existem `overlays/dev/{apps,databases}` e `overlays/hmg/apps`, mas não há `kustomization.yaml` na raiz de cada ambiente, então `kubectl apply -k infra/k8s/overlays/dev` não monta a plataforma (Postgres, Redpanda, Redis, observabilidade, Keycloak, apps, bancos).
- Recomendação: não copiar do antecipa-market. Há duas dependências de `edge` (URL do back-channel do Keycloak e o Secret `redis`), então o conteúdo só fecha com a borda `bff`. Se o template quiser um overlay implantável, o caminho certo é trazer do platform na tag rc.7 com o trecho de `edge` condicionado, ou pedir ao plugin que passe a gerá-lo (hoje a regra do AGENTS.md "infra/ é saída do plugin, não editar à mão" não cobre esses arquivos porque o plugin os omite). Prioridade baixa: o template não tem apps.
- Esforço: M. Risco: médio (manifests k8s sem validação em cluster).

### ANT-11 | Classe B/D (opcional) | `.claude/settings.json`: lista `permissions.allow`

- Arquivo: `.claude/settings.json` (antecipa-market `6848f41`, "add additional permissions for plugin operations"; template tem só `extraKnownMarketplaces` e `enabledPlugins`).
- O que mudou: 16 permissões `allow`, a maioria acúmulo de aprovações pessoais (MCP do Linear, `ctx_search` do context-mode, `search_for_pattern` do Serena).
- Subconjunto genérico e somente leitura, caso se queira reduzir prompts em todo derivado: `Bash(pnpm biome ci *)`, `Bash(gofmt -l *)`, `Bash(go vet .)`, `Bash(go vet ./...)`, `Bash(go version)`, `Bash(go doc *)`, `Bash(docker compose ls *)`.
- Recomendação: não copiar a lista inteira (ela é por pessoa e por plugin instalado; o lugar natural é `settings.local.json`, que o template já tem). `Bash(pnpm config get *)` pode imprimir token de registry no transcript, então ficaria fora mesmo no subconjunto.
- Esforço: P. Risco: baixo (subconjunto) a médio (lista completa em arquivo compartilhado).

---

## Achados C (chegam pelo bump do `@mateusmacedo/dmpf-plugin`, rc.3 para rc.7)

Todos os itens abaixo são aplicados por `nx migrate` (`sync-init` e `update-versions`) mais `pnpm install`, sem edição à mão, a menos que o ANT-07 diga o contrário. Os commits do antecipa-market que fizeram o bump: `b5bb591` (rc.4), `b297d0c` (rc.5), `9509bb3` (rc.7).

### ANT-03 | Classe C | Pins do plugin, lockfile e chamador de CI

- Arquivos: `pnpm-workspace.yaml` (catalog `@mateusmacedo/dmpf-plugin`: `1.0.0-rc.3` para `1.0.0-rc.7`, e `minimumReleaseAgeExclude`), `pnpm-lock.yaml`, `.github/workflows/dmpf-ci.yml` (`workflowRef` `5def4d2d749bf8d5b2ef683f3cdc97eadf354c26` para `ddd3d0c4202879f168c7f6bfafaefadd94a3a621`; `plugin-version` para `1.0.0-rc.7`), `dmpf.rendered.json` (hashes).
- Observação: o `minimumReleaseAgeExclude` do template cita a versão exata do plugin e precisa trocar junto (ADR-011: "Versão recém-publicada do plugin entra no minimumReleaseAgeExclude"). No antecipa-market o commit `9509bb3` o trocou.
- Esforço: P. Risco: baixo (o template-smoke prova o resultado).

### ANT-04 | Classe C | Ativos de IA do DMPF

- Arquivos: `.agents/skills/dmpf-bounded-context/{SKILL.md, references/armadilhas.md, references/golden-path.md, references/template-bounded-context.md}`, `.agents/skills/dmpf-testkit/{SKILL.md, references/package-routing.md}`, `.claude/agents/dmpf-context-author.md`, `.claude/commands/dmpf-new-context.md`, `.claude/rules/dmpf-bounded-context.md`.
- O que muda: re-pin dos links para o `workflowRef` do rc.7, `conformance@v1.0.0-rc.7`/`infrasync@v1.0.0-rc.7`, e conteúdo novo (a rule cresceu 58 linhas, 36 delas no rc.7, sobre a guarda de pré-condições do kernel).
- Estado do template: o `dmpf.rendered.json` do template está íntegro, então a reescrita é automática.
- Esforço: P. Risco: baixo.

### ANT-05 | Classe C | Go, golangci-lint e `.golangci.yml`

- Arquivos: `go.work` (diretiva `1.26.9` para `1.26.10`), `nx.json` (`golangci-lint@v2.13.2` para `@v2.15.0`), `.golangci.yml` (rc.4: +14 linhas; rc.7: +28 linhas), `.github/workflows/dmpf-ci.yml`.
- Evidência: `e9ff133` ("sobe o Go para 1.26.10 por causa da GO-2026-6809") foi manual, antes do rc.7; o rc.7 traz a mesma diretiva em `versions.json` e a migration `update-versions` regrava `go.work`, o pin do golangci-lint e o do govulncheck. O `9509bb3` registra "o go 1.26.10 como diretiva do plugin nas docs".
- Implicação: o `go.work` do template (`go 1.26.9`) fica com a toolchain apontada pelo `e9ff133` como afetada pela GO-2026-6809 (não verifiquei o advisory, só a mensagem do commit). O bump resolve.
- Esforço: P. Risco: baixo.

### ANT-06 | Classe C | Infra gerada: Keycloak de referência, Redis com ACL e infra de teste

- Arquivos novos (rc.5, `b297d0c`): `infra/keycloak/` (8 arquivos, `dmpf-realm.json` com 917 linhas, `dev/seed.sh`, `dev/seed-job.yaml`, `dev/pvc.yaml`, `dev/kustomization.yaml`, `deployment.yaml`, `service.yaml`, `kustomization.yaml`), `infra/k8s/base/redis/` (4 arquivos), `infra/local/compose/keycloak.yml`.
- Arquivos alterados: `infra/local/compose/redis.yml` (imagem fixada por digest, ACL, AOF, `maxmemory`), `infra/local/compose/exporters.yml` (`redis-exporter` com usuário `exporter`), `infra/local/compose/postgres.yml` e `infra/k8s/base/postgres/kustomization.yaml` (só comentário, ADR-063), `infra/test/compose.yml` (+77 linhas: Redis e Keycloak de teste), `.env.example` (+11: `REDIS_URL`, `KEYCLOAK_*`), `infra/local/env.platform.example` e `infra/local/.env.example` (`REDIS_REVOCATION_PASSWORD`, `REDIS_EXPORTER_PASSWORD`, `KEYCLOAK_*`), `infra/observability/grafana/dashboards/infra/containers.json` (título).
- Parametrização: os templates do plugin tratam `edge` vazio (o caso do template). Exemplo: `KEYCLOAK_BACKCHANNEL_LOGOUT_URL=<% if (edge) { %>...<% } %>` e `profiles: [redis, <% if (edge) { %>dmpf, keycloak, <% } %>all]`. No template (`edge: ""`) o resultado é diferente do antecipa-market (`edge: "bff"`); não copiar os arquivos do antecipa-market, deixar o plugin renderizar.
- Esforço: P (automático) mais a validação do ANT-07. Risco: médio (o Keycloak e o Redis novos entram no `infra-budget` do Compose; o `keycloak.yml` já nasce fora de `all` justamente por isso).

### ANT-07 | Classe C (com passos manuais) | O que o bump NÃO faz sozinho

Fatos tirados dos commits do antecipa-market e do diff contra o plugin:

1. `infra/local/docker-compose.yml` é seed e o `sync-init` não o reescreve. O `b297d0c` registra: "o include do compose/keycloak.yml entrou à mão no docker-compose.yml local". O seed do rc.7 já traz `- compose/keycloak.yml`; o template tem de acrescentar essa linha (última do `include`) à mão.
2. O `infrasync --write` regrava os arquivos derivados dos apps (`infra/local/compose/provisioning.generated.yml`, `pki.yml`, `swagger-ui.yml`, `infra/local/.env.example`, `infra/observability/alloy/alloy-kubernetes.alloy`, `infra/k8s/overlays/*/{apps,databases}`). O template-smoke roda `infrasync --check` (linha 96), então rodar `go run github.com/mateusmacedo/dmpf/tools/dmpf-conformance/cmd/infrasync@v1.0.0-rc.7 --root . --write` faz parte do bump. Não verifiquei o que ele muda com zero apps; vale conferir o diff antes de commitar.
3. Referências de versão escritas à mão em prosa, que o antecipa-market atualizou nos commits de bump:
   - `AGENTS.md` linha 196: `@mateusmacedo/dmpf-plugin` `1.0.0-rc.3` para `rc.7`.
   - `README.md` linha 10: `1.26.9` e `rc.3` para `1.26.10` e `rc.7`.
   - `docs/onboarding.md` linha 13: `1.26.9` para `1.26.10`.
   - `docs/guides/primeiro-bounded-context.md` linhas 6 e 7: link e commit `5def4d2` (`workflowRef` do rc.3) para `ddd3d0c` (rc.7).
   - Manter como estão (histórico): o ADR-011 do template e a spec de greenfield do template mencionam rc.3 como decisão datada.
4. Passo de prova: `bash tools/template-smoke.sh` (lê as versões de `versions.json`, não precisa de edição). O antecipa-market não validou rc.5 e rc.7 com o smoke (já o havia removido).
5. Sequência sugerida: `pnpm nx migrate @mateusmacedo/dmpf-plugin@1.0.0-rc.7`, `pnpm install`, `pnpm nx migrate --run-migrations`, depois os itens 1 a 3, depois o smoke. Como a `migrations.json` do rc.7 só tem entradas rc.7, o salto direto rc.3 para rc.7 roda cada migration uma vez (não precisa passar pelo rc.4 e rc.5).

- Esforço do conjunto ANT-03 a ANT-07: M. Risco: médio (primeiro bump do template para a faixa que traz Keycloak e Redis; o smoke é o gate).

---

## Achado A já coberto pelo WIP do template

### ANT-09 | Classe A (coberto pelo WIP) | Agentes e skills em `opus`

- Arquivos: 28 em `.claude/agents/*.md` (excluindo `dmpf-context-author.md`) e 24 em `.claude/skills/*/SKILL.md`.
- O que mudou: `model: sonnet` para `model: opus` (`5893017`, "migrate agents and skills to use the opus model", 21/10), `golang-pro` ganha `skills:` com 10 skills (`f39bd2c`, "update model and enhance skills list for Go development", 18/10), newline final em vários agentes.
- Cobertura: `diff -rq` entre o working tree do template e o HEAD do antecipa-market nesses dois diretórios não acusa nenhuma diferença. O WIP do template (51 arquivos) é equivalente ao delta.
- Recomendação: nada a copiar; basta commitar o WIP do template. Se o WIP for revertido ou editado, comparar de novo antes.
- Esforço: P (commit). Risco: baixo.
- Fora do escopo, mas visível na comparação: o WIP do template também apaga `tsconfig.base.json` (o antecipa-market o mantém, assim como o `AGENTS.md` do template o descreve com `paths` vazio) e deixa `apps/backend/playground/` não rastreado. Confirmar se essas duas mudanças são intencionais antes de commitar.

---

## Achados D (específicos do projeto, não levar)

Uma linha por item:

| Id | Itens | Evidência |
| --- | --- | --- |
| ANT-12 | `.obsidian/` (bundles de `obsidian-git`, `excalidraw`, `realclaudian`, `table-editor`, mais de 68 mil linhas) e `biome.json` (`!.obsidian` e `assist` reformatado) | `477046a` |
| ANT-13 | `docs/adr/012` a `022` (decisões do produto), contador "último registrado" do `docs/adr/README.md`, `docs/README.md`, `docs/reference/*` (7), `docs/resumo-executivo-apuracao.md`, `docs/prd`, `docs/design` e as specs de produto (20 arquivos novos) | `c748cd0`, `eff16cf`, `2994774` |
| ANT-14 | `dmpf.json` (prefixo, `edge: bff`, `composeProject`, `imageRegistry`, `bufModule`), `go.work` (`use` e `replace`), `go.work.sum`, `tools/dmpf-baseline/units-baseline.json` | `79c93b3`, `4b1c469`, `cf7a459` |
| ANT-15 | `nx.json` `release.groups` `go-contract-partner` e `go-contract-identity` (gerados pelo `bounded-context`) | `79c93b3`, `cf7a459` |
| ANT-16 | Derivados dos apps pelo `infrasync`: `infra/k8s/overlays/{dev,hmg}/{apps,databases}`, `compose/pki.yml`, `compose/provisioning.generated.yml`, `compose/swagger-ui.yml`, `infra/local/docker-compose.yml` (`name` e includes dos apps), `alloy-kubernetes.alloy`, `GRPC_TRUSTED_CLIENTS` com `bff` | `79c93b3`, `c12d3ef` |
| ANT-17 | Remoção do `template-smoke` (job do `ci.yml`, `tools/template-smoke.sh`, menções em README, AGENTS, docs) | `48fdda6` (o ajuste útil ao template está no ANT-10) |
| ANT-18 | `apps/backend/{bff,identity,partner}` e contratos | vários |

Cuidado para sincronizações futuras: o antecipa-market ocupou os ADRs `012` a `022` com decisões de produto. Se o template criar um ADR-012 ou posterior (por exemplo, para registrar o bump do plugin), a numeração vai colidir num eventual merge entre os repositórios.
