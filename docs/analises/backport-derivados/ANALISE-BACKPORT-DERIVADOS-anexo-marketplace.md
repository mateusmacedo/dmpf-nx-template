# Delta de engenharia do marketplace em relação ao nx-base-template

Escopo: `git -C marketplace diff b4649d2 HEAD`, fora de `apps/`, `libs/`, `docs/product`, `docs/specs` e `docs/roadmap.md`. São 36 commits (35 sem o merge); 71 arquivos de engenharia/tooling alterados, sem contar `.claude/agents` e `.claude/skills`.

Legenda: A = genérico, vai como está. B = genérico, precisa de parametrização ou limpeza. C = chega pelo bump do `@mateusmacedo/dmpf-plugin`. D = específico do projeto.

## Conclusão em três linhas

1. Quase todo o delta de infra é saída do plugin, não edição manual. O marketplace subiu o plugin de `1.0.0-rc.3` para `1.0.0-rc.7` (catalog do `pnpm-workspace.yaml`, commit `c249081`), e `rc.7` é a versão mais recente publicada (GitHub Packages: 2026-10-21; `rc.6` em 2026-10-20).
2. Nenhum dos 80 arquivos gerenciados do `dmpf.rendered.json` do marketplace foi editado à mão (hash de cada arquivo confere com o registrado). A parte realmente manual e genérica é pequena: `.gitignore`, uma regra do `AGENTS.md`, os `model: opus` dos agentes e skills (já no WIP do template) e passos que acompanham o bump.
3. `infra/keycloak` não é decisão do produto: é saída gerenciada da `rc.7`. O IAM local genérico chega ao template pelo bump (MKT-01). O que é do produto (organização `marketplace`, client `marketplace-dev`, `POST /auth/token`) fica em `apps/backend/bff/deploy/keycloak` e é D.

## Método e verificações

- Hash dos arquivos gerenciados: para cada caminho de `dmpf.rendered.json`, sha256 do arquivo atual contra o hash registrado. Marketplace: 80 de 80 conferem, nenhum editado. Template: 67 de 67 conferem.
- Renderizador próprio dos templates `init/managed`, `init/seed`, `init/version` e `ai` do plugin (EJS, mesmos parâmetros do generator `init`), validado nos dois sentidos: render `rc.3` com os parâmetros do template reproduz o template HEAD (71 de 71 idênticos); render `rc.7` com os parâmetros do marketplace reproduz o marketplace (82 de 84 idênticos; os 2 que diferem são seeds editados de propósito: `infra/local/docker-compose.yml` e `tools/dmpf-baseline/units-baseline.json`).
- Render `rc.7` com os parâmetros do template contra o template HEAD: 52 idênticos, 13 arquivos novos, 19 alterados (18 gerenciados e 1 seed). Isso é exatamente o que o bump faria no template. Artefatos do render em `scratchpad/r7_tpl`.
- Leitura remota (somente leitura, `gh api`) do `dmpf-go-ci.yml` e do `dmpf-scope/scope.sh` no SHA `ddd3d0c` (o `workflowRef` da `rc.7`): copias em `scratchpad/dmpf-go-ci-rc7.yml` e `scratchpad/dmpf-scope.sh`.
- Comparação dos 49 arquivos de `.claude/{agents,skills,commands,rules}` alterados no marketplace com o working tree do template: 46 idênticos (WIP do template já os cobre) e 3 diferentes (os 3 são saída do plugin).

---

## MKT-01 | C | Bump do `@mateusmacedo/dmpf-plugin` de `1.0.0-rc.3` para `1.0.0-rc.7`

Arquivos (no template, o bump traria):

- Versão e pins: `pnpm-workspace.yaml` (catalog e `minimumReleaseAgeExclude`: `rc.3` por `rc.7`), `pnpm-lock.yaml` (só a entrada do plugin), `go.work` (`go 1.26.9` para `go 1.26.10`), `nx.json` (pin `golangci-lint@v2.13.2` para `@v2.15.0`), `.github/workflows/dmpf-ci.yml` (SHA do reutilizável `5def4d2` para `ddd3d0c` e `plugin-version`).
- 13 arquivos novos, todos gerenciados: `infra/k8s/base/redis/{kustomization,networkpolicy,service,statefulset}.yaml`; `infra/keycloak/{deployment,kustomization,service}.yaml`, `infra/keycloak/dev/{kustomization,pvc,seed-job}.yaml`, `infra/keycloak/dev/seed.sh`, `infra/keycloak/dmpf-realm.json`; `infra/local/compose/keycloak.yml`.
- 18 arquivos gerenciados alterados: `.agents/skills/dmpf-bounded-context/**` (4), `.agents/skills/dmpf-testkit/**` (2), `.claude/agents/dmpf-context-author.md`, `.claude/commands/dmpf-new-context.md`, `.claude/rules/dmpf-bounded-context.md`, `.env.example` (+11 linhas: `REDIS_URL`, `KEYCLOAK_*`), `.golangci.yml` (+41/-1: regras IDN-14 e depguard do testkit), `infra/k8s/base/postgres/kustomization.yaml`, `infra/local/compose/{exporters,postgres,redis}.yml`, `infra/local/env.platform.example`, `infra/test/compose.yml` (+77: Keycloak e Redis de teste).
- O que a `rc.7` traz de novo para contextos futuros (já refletido nos templates do `bounded-context`, não nos arquivos do template atual): role migradora `<app>_migrator` (ADR-063), `deploy/.env.migrator.example`, deny-list de revogação no Redis, Keycloak 26.8.1 com o realm `dmpf`.

O que mudou (resumo concreto): o commit `c249081` do marketplace (feito quando o workspace ainda não tinha nenhuma app, estado equivalente ao do template) reproduz exatamente a lista acima. O commit `317f048` (init com a identidade do marketplace) só troca parâmetros (`modulePrefix`, `composeProject`, `edge`, registry), então é D.

Evidência: `c249081`; `migrations.json` do plugin `rc.7` traz os generators `sync-init` e `update-versions` (reaplicam templates não editados e sobem pins e a diretiva do `go.work`); README do plugin: o `init` reescreve gerenciados enquanto o hash bater e roda o `infrasync` depois do flush.

Recomendação: no template, `pnpm nx migrate @mateusmacedo/dmpf-plugin@1.0.0-rc.7` seguido de `pnpm nx migrate --run-migrations`, e conferir que o resultado é igual ao render de `scratchpad/r7_tpl`. Nenhum arquivo DMPF deve ser copiado à mão (ADR-011). Depois do bump, rodar `bash tools/template-smoke.sh` (gera contexto, roda `conformance`, `modsync`, `infrasync --check` e `context-check`) e abrir PR de teste para ver o job `DMPF / DMPF`.

Esforço: M. Risco: médio. O `template-smoke` e o `dmpf-ci.yml` não foram executados contra a `rc.7` neste levantamento; o `.gitignore` (MKT-04) precisa entrar junto, e o token do GitHub Packages com `read:packages` precisa estar válido.

## MKT-02 | B | Passos manuais que acompanham o bump (a migração não cobre)

Arquivos:

- `infra/local/docker-compose.yml` (seed, só criado, nunca reescrito): o render `rc.7` acrescenta `- compose/keycloak.yml` na lista de `include`. O marketplace fez essa edição à mão no commit `317f048`. No template: acrescentar a linha depois do `swagger-ui.yml`.
- Gerados pelo `infrasync` (não são gerenciados, mas mudam no bump): `infra/local/.env.example` e `infra/local/compose/provisioning.generated.yml`. O commit `c249081` do marketplace os alterou sem nenhuma app presente (+16 e +34 linhas). Conferir que o `init`/migração os regenera; senão rodar `go run github.com/mateusmacedo/dmpf/tools/dmpf-conformance/cmd/infrasync@v1.0.0-rc.7 --root . --write`.
- Textos escritos à mão com a versão: `AGENTS.md:147` (`go 1.26.9`), `AGENTS.md:196` (`rc.3`), `README.md:10` (Go `1.26.9` e `rc.3`), `docs/onboarding.md:13` (`1.26.9`), `docs/guides/primeiro-bounded-context.md:6-7` (commit `5def4d2` e `rc.3`; novo: `ddd3d0c` e `rc.7`). O marketplace os atualizou em `c249081` e `8a91a96`. ADR-011 e a SPEC `TXJ6A4XX` citam `rc.3` como histórico e devem ficar como estão.

Esforço: P. Risco: baixo.

## MKT-03 | B | Premissa "`dmpf-ci.yml` vermelho no template" pode ficar obsoleta com a `rc.7`

Arquivos afetados no template: `docs/adr/011-template-consome-dmpf-por-versao.md` (linhas 31-32, 72-73, 107-108), `AGENTS.md:233`, `README.md:219`, `docs/ci-cd/README.md:16`.

O que mudou: no marketplace, o addendum da ADR-012 (commit `3fa0e1b`) registra que o `gate-check` não reprova o CI: o reutilizável da `rc.7` só roda o `dmpf-gate-check.sh` no job `self-tests`, que depende do input `self-tests` (padrão `false`), e o job `DMPF / DMPF` passou no PR #1. A leitura remota do `dmpf-scope/scope.sh` (`ddd3d0c`) confirma que o `conformance` só roda quando o diff toca projetos Go afetados, `*dmpf-units.json`, `tools/dmpf-baseline/*` ou `tools/dmpf-conformance/*`.

Ressalva importante: no marketplace já havia módulo Go quando isso foi observado; no template, sem nenhum módulo Go, o comportamento da `rc.7` não foi exercitado aqui. Os checks `init`, `infrasync` e `versions` do mesmo job também podem rodar quando o PR do bump tocar `infra/*`, `.golangci.yml` e `dmpf.json`.

Recomendação: depois do MKT-01, abrir PR draft no template, observar o resultado do `DMPF / DMPF` e só então reescrever os 4 trechos acima (e as consequências da ADR-011, por ADR nova ou addendum). Não copiar o texto do commit `8a91a96` do marketplace: ele ainda dizia "gate-check falha por falta de provider" e foi corrigido depois, em `3fa0e1b`.

Esforço: P a M. Risco: baixo.

## MKT-04 | A | `.gitignore`: liberar `.env.*.example`

Arquivo: `.gitignore` (+1 linha `!.env.*.example` depois de `!.env.example`).

Evidência: commit `23ec6b8`. No template, `.env.*` na linha 64 ignora `deploy/.env.migrator.example` e `deploy/.env.session-events.example` (confirmado com `git check-ignore -v` no template). A `rc.7` passa a gerar `deploy/.env.migrator.example` em cada contexto, e o `project.json` gerado (target `deploy-env`) faz `cp` dele para `deploy/.env.migrator`. Sem a negação, o arquivo do contexto não é versionado e o target quebra em clone novo. O `template-smoke` (que roda num repositório descartável) provavelmente não percebe.

Recomendação: aplicar no template junto com o MKT-01. Esforço: P. Risco: nulo.

## MKT-05 | A | `AGENTS.md`: exigir o agente `golang-pro` na implementação Go

Arquivo: `AGENTS.md`, seção "Orquestração de agentes e skills": `- Implementação de código Go: use sempre o agente `golang-pro` (`.claude/agents/golang-pro.md`).`

Evidência: commit `a98a2bb`. É a contraparte do `skills:` do `golang-pro` (MKT-06): o agente declara as skills Go e o `AGENTS.md` manda usá-lo. O template já tem `.claude/agents/golang-pro.md` e o workspace é preparado para Go.

Recomendação: adicionar a linha no template. Esforço: P. Risco: baixo.

## MKT-06 | A (já coberto pelo WIP do template) | `model: opus` nos agentes e skills, e `skills:` no `golang-pro`

Arquivos: 46 de `.claude/agents/*.md` e `.claude/skills/*/SKILL.md` (`model: sonnet` para `model: opus`) e `.claude/agents/golang-pro.md` (frontmatter ganha `skills:` com `skill-go`, `skill-go-db-patterns`, `skill-go-http-patterns`, `skill-go-queue-patterns`, `skill-go-testing`, mais as skills de arquitetura, DDD, padrões e performance já listadas no diff).

Evidência: commit `79c10d8`. Os 46 arquivos ficam byte a byte idênticos ao working tree atual do template (os 3 restantes dos 49 são saída do plugin, ver MKT-01). Também há ruído de fim de arquivo (nova linha final) em cerca de 20 agentes, igual nos dois lados.

Recomendação: nada a copiar; basta consolidar o WIP. Os arquivos gerenciados pelo plugin não são tocados pelo WIP (interseção com `dmpf.rendered.json` é vazia), então o bump não encontra conflito de hash. Esforço: P. Risco: baixo.

## MKT-07 | B | `.claude/settings.json`: `enabledPlugins` vazio

Arquivo: `.claude/settings.json` (remove `"nx@nx-claude-plugins": true`; mantém `extraKnownMarketplaces`).

Evidência: commit `80a64c5`, sem corpo e sem registro em ADR ou doc. Hipótese não confirmada: as skills do Nx já vêm versionadas em `.agents/skills/` (`nx-workspace`, `nx-generate`, `nx-run-tasks`, `nx-plugins`, `nx-import`, `monitor-ci`, `link-workspace-packages`), então o plugin duplicaria as mesmas skills.

Recomendação: confirmar o motivo com o dono antes de portar; se for a duplicação, vale tirar o plugin do template também. Esforço: P. Risco: baixo.

## MKT-08 | B | Oportunidade: checklist ou script de identidade ao derivar do template

Não é cópia de arquivo, é lição do delta. Para virar `marketplace`, o projeto teve de editar à mão: 13 arquivos só para o nome do pacote raiz (commit `4b5483e`: `ci.yml`, `nx-release.yml`, `nx-publish-libs.yml`, `publish-libs.yaml`, `PULL_REQUEST_TEMPLATE.md`, `AGENTS.md`, `README.md`, `docs/onboarding.md`, `docs/guides/development-workflow.md`, `docs/guides/primeiro-bounded-context.md`, `lefthook.yml`, `package.json`, `project.json`), o `name:` do seed `infra/local/docker-compose.yml` (`317f048`), o `nxCloudId` do `nx.json` (`e3c26ab`; o `nx connect` reescreve o arquivo e exigiu `biome format` depois, em `23ea74c`) e a linha do tracker (`4dfd051`).

Recomendação: seção curta em `docs/onboarding.md` listando essas strings de identidade, ou um script em `tools/` que as troque. Esforço: P (checklist) ou M (script). Risco: baixo.

## MKT-09 | A | Guia do primeiro contexto: o `gate-check` só enxerga arquivos rastreados

Arquivo: `docs/guides/primeiro-bounded-context.md` (nota nova na seção "Rodar os gates").

Evidência: addendum da ADR-012 (`3fa0e1b`) e o próprio `dmpf-gate-check.sh` do plugin (`git ls-files '*dmpf-units.json'`, linhas 607 e 667; falha "nenhum provider de contexto encontrado" na linha 746). O guia atual do template não menciona isso: quem gera o contexto e roda o gate antes do `git add` vê o gate reprovar por falta de provider.

Recomendação: uma frase no guia ("faça `git add` do contexto gerado antes de rodar `dmpf-gate-check.sh`"). Esforço: P. Risco: nulo.

---

## D | Específico do projeto, não levar (uma linha cada)

- `apps/backend/bff`, `apps/backend/tenancy` (e `tenancy/contract`), e tudo que os registra: `go.work` (`use` e `replace`), `go.work.sum`, `nx.json` (`release.groups.go-contract-tenancy`), `tools/dmpf-baseline/units-baseline.json` (entradas das 2 apps).
- Arquivos gerados pelo `infrasync` com entradas de app (cabeçalho "Gerado por ... não edite"): `infra/k8s/overlays/{dev,hmg}/apps/kustomization.yaml`, `infra/k8s/overlays/dev/databases/{job,kustomization}.yaml`, `infra/local/compose/{pki,swagger-ui,provisioning.generated}.yml`, `infra/observability/alloy/alloy-kubernetes.alloy`, entradas de app em `infra/local/.env.example`.
- Parâmetros do `init` do marketplace: `dmpf.json`, `dmpf.rendered.json`, `.golangci.yml` (prefixo `github.com/mateusmacedo/marketplace` nas 4 allowlists e no `gci`), `infra/test/compose.yml`, `app-base.yml`, `redis.yml`, `containers.json` (só `composeProject` e `edge`).
- `docs/adr/012-borda-e-infra-alinhadas-ao-dmpf.md` e `013-tenant-e-a-loja-do-seller.md` (decisões de IdP, borda e tenant do marketplace; os fatos genéricos do addendum da ADR-012 já estão em MKT-03 e MKT-09; atenção: 012 e 013 colidem com a numeração do próximo ADR do template), `docs/adr/README.md` (linhas das ADRs 012 e 013), `docs/roadmap.md`, `docs/product/**` e as 14 specs de `docs/specs` (nenhum arquivo do catálogo ou do template de specs foi alterado).
- Renomeação de identidade (`@marketplace/source`, nome do projeto Linear, `name: marketplace-local`, `nxCloudId`): ver MKT-08 para a lição.
- Remoção do `template-smoke` (job no `ci.yml`, `tools/template-smoke.sh` e as menções em `AGENTS.md`, `README.md`, `docs/ci-cd/README.md`, `docs/guides/primeiro-bounded-context.md`): o smoke é do template e deve permanecer nele.
- `infra/keycloak/**` do marketplace: é saída da `rc.7` (MKT-01); o seed complementar do produto vive em `apps/backend/bff/deploy/keycloak` (organização `marketplace`, client `marketplace-dev`, rota `POST /auth/token`).

## Observações fora do delta (não são do marketplace)

- O WIP do template deleta `tsconfig.base.json` (23 linhas), enquanto o marketplace o mantém e o `AGENTS.md` do template ainda o descreve (`paths` vazio). Vale confirmar que a remoção é intencional antes de consolidar o WIP.
- `apps/backend/playground/` não rastreado no template: nenhum equivalente no marketplace.
