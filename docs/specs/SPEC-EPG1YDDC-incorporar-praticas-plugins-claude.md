---
id: SPEC-EPG1YDDC
slug: incorporar-praticas-plugins-claude
title: Incorporar práticas genéricas de engenharia do plugins-claude no template
stage: done
priority: P1
depends_on: [SPEC-4NR9KKS8]
ticket_url: null
subtask_urls: []
created: 2026-07-31
---

# SPEC-EPG1YDDC: Incorporar práticas genéricas de engenharia do plugins-claude no template

## Resumo

O marketplace `plugins-claude` (plugin `mmda-flow`) concentra convenções,
artefatos de estrutura e formato de trabalho maduros para desenvolvimento
assistido por IA. Esta spec define o que o `nx-base-template` deve **assar
(bake)** no repositório versus o que deve **consumir** via instalação do
plugin — mantendo o propósito de cada projeto intacto.

Como mantenedor do template, quero que projetos derivados nasçam com scaffold
de engenharia alinhado ao mmda-flow (specs, rules de domínio, guia de
workflow, ADRs) sem transformar o template em marketplace nem forkar o
runtime do plugin.

## Contexto

- **Problema**: o template já adota parcialmente o formato de specs do
  mmda-flow (`docs/specs/SPEC-*` com frontmatter), mas falta o scaffold que
  o `/mmda-flow:skill-init` provisiona, rules de processo mais rígidas e a
  documentação explícita da fronteira plugin × template. Sem isso, cada
  projeto derivado reinventa estrutura ou copia o plugin de forma destrutiva.
- **Impacto**: onboarding inconsistente; risco de duplicar skills homônimas
  (`bug-fix`, `code-review`, `quality-checklist`); risco de importar o
  workflow git do plugin (PR → `main`) que conflita com o git-flow Lidercap
  (trabalho → `develop` → `release` → `master` + Gitea).
- **Inspiração**: `plugins-claude` / `plugins/mmda-flow`, em especial:
  - templates em `hooks/templates/` (scaffold provisionado)
  - `docs/specs/README.md`, `docs/rules/**`, `docs/guides/development-workflow.md`
  - rules técnicas (`git-safety`, `comment-discipline`, `ephemeral-refs`,
    `process-enforcement`)
- **Links relevantes**:
  - Gap analysis da sessão (canvas `plugins-to-nx-gap-analysis`)
  - `SPEC-4NR9KKS8` — já portou convenções de IA do telesena; esta spec
    complementa com artefatos de processo do mmda-flow
  - `SPEC-YWAWQHPX` — hardening de tooling/docs do template
  - `AGENTS.md` — inventário e git-flow canônicos do template
  - `docs/adr/005-plataforma-gitea.md` — plataforma ≠ GitHub/`gh`
- **Referências externas**:
  - Fonte estável (canônica): `https://github.com/mateusmacedo/plugins-claude`
    — declarada em `plugins/mmda-flow/.claude-plugin/plugin.json` (campo
    `repository`). O marketplace está em mudança de propriedade; esta é a base
    a considerar
  - Clone de trabalho nesta máquina:
    `/home/mmanjos/work/repositories/plataform/plugins-claude`
  - Plugin: `plugins/mmda-flow` v0.3.22 (README + `docs/architecture.md`)

<constraints>
- [P0] NUNCA forkar runtime do plugin (hooks Python/Node, `setup.mjs`,
  `skill-init`/`skill-sync`/`skill-config`, manifests de config-sync) para
  dentro do template
- [P0] NUNCA importar a regra "PR sempre para main/master" sem reescrevê-la
  para git-flow Lidercap + Gitea
- [P0] NUNCA sobrescrever skills de domínio do template
  (`skill-bug-fix`, `skill-code-review`, `skill-quality-checklist`,
  Nest/Go/TypeORM) com as homônimas do plugin
- [P0] Manter `docs/adr/` como pasta canônica de ADRs — NÃO renomear para
  `docs/decisions/`
- [P1] plugins-claude permanece marketplace; nx-base-template permanece
  baseline Nx — nenhum dos dois absorve o propósito do outro
- [P1] Todo texto bakeado DEVE estar em PT-BR com acentuação correta;
  código/identificadores em inglês
</constraints>

## Requisitos

**Escopo desta entrega: Fases 1, 2 e 3** — os 13 RFs entram na mesma
implementação. As prioridades (`P0`/`P1`/`P2`) ordenam a execução dentro do
plano; não delimitam fases opcionais.

### Funcionais

**Fase 1 — Scaffold de engenharia (bake)**

- [x] **[P0] RF1 — Catálogo e template de specs**: criar
  `docs/specs/README.md` adaptado do mmda-flow (ciclo de vida, frontmatter,
  checklist de qualidade, template resumido). Remover dependência de
  `${CLAUDE_PLUGIN_ROOT}` / scripts do plugin no texto do template; apontar
  para o formato já usado pelas SPECs existentes e, se útil, mencionar que
  o gerador de ID vive no plugin quando instalado.
- [x] **[P0] RF2 — Regras de domínio (BIZ/APP/PRD)**: criar
  `docs/rules/README.md` e
  `docs/rules/{business,application,product}/README.md` com formato
  `REGRA-NNN` / prefixos `BIZ-` / `APP-` / `PRD-`. Pastas começam sem regras
  de produto (template genérico).
- [x] **[P0] RF3 — Guia de workflow local**: criar
  `docs/guides/development-workflow.md` baseado no guia do plugin, porém:
  - PR padrão contra `origin/develop` (não `main`)
  - fluxo git-flow documentado em `AGENTS.md` / `CONTRIBUTING.md`
  - plataforma Gitea (API `/api/v1/...`), sem assumir `gh` como único meio
  - Conventional Commits em PT-BR com scope = projeto Nx sem prefixo da org
- [x] **[P0] RF4 — README de ADRs**: criar `docs/adr/README.md` com
  "quando criar", template (seções, **sem** frontmatter — como os ADRs locais,
  onde `## Status` é opcional) e índice das ADRs existentes. Manter
  numeração/`docs/adr/` atuais.
- [x] **[P1] RF5 — Inventário**: atualizar `AGENTS.md` e
  `docs/onboarding.md` para listar a nova árvore `docs/` e a fronteira
  "consumir mmda-flow vs artefatos bakeados".

**Fase 2 — Convenções de IA e PR**

- [x] **[P1] RF6 — process-enforcement**: endurecer
  `.claude/rules/process-enforcement.md` alinhando-o ao rigor do template
  provisionado pelo plugin (spec para features; plano para 2+ arquivos /
  refactors), preservando exceções (bug trivial, "pode fazer direto") e o
  bloco Go já existente.
- [x] **[P1] RF7 — Rules leves de higiene/segurança git**: adicionar em
  `.claude/rules/` versões **documentais** (sem hooks) de:
  - `git-safety.md` (sem `--no-verify`, sem force push em protegidas,
    revisar diff, não alterar testes só para passar)
  - `comment-discipline.md` (porquê vs quê; marcadores `WHY:` /
    `INVARIANT:` / `WORKAROUND` / `SAFETY:`)
  - `ephemeral-refs.md` (não citar `plans/`, `CHECKPOINT`, `.state/` em
    código/docs permanentes; exceção ADRs→specs)
  Atualizar `.claude/README.md` com as novas rules.
- [x] **[P1] RF8 — Pull request template**: criar
  `.github/PULL_REQUEST_TEMPLATE.md` adaptado (contexto, tipo, base
  develop/release, checklist de validação Nx/Biome, evidências). Sem
  checkboxes exclusivos de release-please/CodeRabbit do plugin.
- [x] **[P1] RF9 — Política de `plans/`**: manter `plans` inteiro no
  `.gitignore` (opção B — decisão registrada em "Decisões técnicas"; já é o
  estado atual em `.gitignore:51`) e documentar em `docs/onboarding.md` que
  planos são artefatos locais, não versionados. Nenhuma alteração no
  `.gitignore` é necessária — a entrega do RF9 é a documentação da política.
- [x] **[P1] RF10 — Nota de consumo do mmda-flow**: em
  `docs/onboarding.md` (e/ou `AGENTS.md`), documentar instalação do
  marketplace/plugin, `/mmda-flow:skill-doctor`, e precedência:
  plugin = pipeline/processo; `.claude/skills` do template = domínio/stack.

**Fase 3 — Integração e fechamento**

- [x] **[P2] RF11 — Checklist de deps do plugin**: listar no onboarding as
  deps úteis (`git`, `node`, `python3`, `jq`, `yq` mikefarah; `gh` só se o
  fluxo do desenvolvedor usar GitHub — Gitea não depende dele).
- [x] **[P2] RF12 — ADR de fechamento**: ao concluir Fases 1–2, registrar
  ADR em `docs/adr/` com fronteira bake vs consume e decisão de `plans/`.
- [x] **[P2] RF13 — Jira/Linear**: NÃO portar skills nem rules de campos
  obrigatórios; apenas mencionar no onboarding que sync de tracker é
  responsabilidade do plugin quando a org adotar.

### Não-funcionais

- [x] **[P0] NFR1**: `pnpm biome check` / lint do template não quebram por
  causa dos novos markdowns.
- [x] **[P1] NFR2**: nenhuma alteração exige runtime Python/Node do plugin
  para o template buildar ou passar CI.
- [x] **[P1] NFR3**: nenhum artefato bakeado (arquivos criados/atualizados
  por RF1–RF12) referencia paths absolutos de máquinas locais (`/home/...`);
  a fonte do plugin é citada pela URL canônica. Esta spec está fora do
  escopo do NFR3 — ela registra o clone de trabalho por rastreabilidade.

## Camadas afetadas

| Camada | Afetada? | Descrição |
|--------|----------|-----------|
| `docs/` | [x] | specs README, rules BIZ/APP/PRD, guides, adr README, onboarding |
| `.claude/rules/` | [x] | process-enforcement + hygiene/git-safety |
| `.claude/README.md` | [x] | índice de rules |
| `AGENTS.md` | [x] | inventário e fronteira plugin |
| `.github/` | [x] | PULL_REQUEST_TEMPLATE |
| `.gitignore` | [ ] | política plans documentada sem alterar o arquivo (RF9) |
| Runtime / apps / libs | [ ] | sem mudança de código de produto |
| Plugin plugins-claude | [ ] | fora de escopo (somente referência) |

## Localização de código

```
nx-base-template/
  docs/specs/README.md                         — criar (RF1)
  docs/specs/SPEC-EPG1YDDC-*.md                — esta spec
  docs/rules/README.md                         — criar (RF2)
  docs/rules/business/README.md                — criar (RF2)
  docs/rules/application/README.md             — criar (RF2)
  docs/rules/product/README.md                 — criar (RF2)
  docs/guides/development-workflow.md          — criar (RF3)
  docs/adr/README.md                           — criar (RF4)
  docs/adr/00N-*.md                            — ADR fechamento (RF12)
  docs/onboarding.md                           — atualizar (RF5, RF9, RF10, RF11, RF13)
  AGENTS.md                                    — atualizar (RF5, RF10)
  .claude/rules/process-enforcement.md         — endurecer (RF6)
  .claude/rules/git-safety.md                  — criar (RF7)
  .claude/rules/comment-discipline.md          — criar (RF7)
  .claude/rules/ephemeral-refs.md              — criar (RF7)
  .claude/README.md                            — atualizar (RF7)
  .github/PULL_REQUEST_TEMPLATE.md             — criar (RF8)
```

**Fontes de adaptação (somente leitura; não copiar runtime).**
Base local: `/home/mmanjos/work/repositories/plataform/plugins-claude`;
canônica: `https://github.com/mateusmacedo/plugins-claude`.

```
plugins-claude/plugins/mmda-flow/hooks/templates/docs/**
plugins-claude/plugins/mmda-flow/hooks/templates/claude/rules/process-enforcement.md
plugins-claude/plugins/mmda-flow/rules/{git-safety,comment-discipline,ephemeral-refs}.md
plugins-claude/docs/guides/development-workflow.md
plugins-claude/.github/PULL_REQUEST_TEMPLATE.md
```

## Design

### Arquitetura (fronteira)

```text
┌─────────────────────────────┐     ┌──────────────────────────────┐
│  plugins-claude / mmda-flow │     │  nx-base-template            │
│  (consumir)                 │     │  (bake)                      │
├─────────────────────────────┤     ├──────────────────────────────┤
│  agents / skills pipeline   │     │  docs/specs|rules|guides|adr │
│  hooks hygiene / guardians  │     │  .claude/rules (docs leves)  │
│  skill-init / sync / config │     │  .claude/skills domínio      │
│  Linear/Jira sync           │     │  AGENTS.md + Nx/CI Gitea     │
└─────────────────────────────┘     └──────────────────────────────┘
         │                                        │
         └──────── desenvolvedor instala ─────────┘
                   mmda-flow no ambiente
```

### Fluxo de execução

1. Aprovar esta spec (`backlog` → `planning` → `building`).
2. Fase 1: bake do scaffold; validar links em `AGENTS.md` / onboarding.
3. Fase 2: rules + PR template + política `plans/` documentada; atualizar
   `.claude/README.md`.
4. Fase 3: ADR de fechamento + checklist de deps + polish do onboarding.
5. Marcar spec `done` quando critérios de aceite passarem.

### Precedência de skills homônimas

| Nome | No plugin | No template | Precedência |
|------|-----------|-------------|-------------|
| bug-fix / code-review / quality-checklist | pipeline mmda | domínio/stack | template para código da org; plugin quando o fluxo mmda for invocado explicitamente |
| planner / spec-management / feature-pipeline | só plugin | — | sempre plugin |
| nest / go / typeorm / typescript | — | só template | sempre template |

## Decisões técnicas

- **Bake vs consume**: evita drift de hooks e mantém um único lugar para
  evoluir a pipeline (o plugin). Alternativa descartada: copiar mmda-flow
  inteiro para `.claude/` — duplicaria manutenção e colidiria com skills.
- **Manter `docs/adr/`**: já há 6 ADRs e referências em `AGENTS.md`.
  Alternativa descartada: migrar para `docs/decisions/` (custo sem ganho).
- **Guia de workflow reescrito**: o template do plugin assume PR→main e
  `gh`; Lidercap usa git-flow + Gitea. Alternativa descartada: copiar o
  guia cru (violaria AGENTS.md).
- **`plans/` permanece fora do versionamento (RF9 — opção B)**: coerente com
  a rule `ephemeral-refs.md` que o RF7 bakeia (artefato efêmero não entra em
  histórico permanente) e sem custo de migração — `plans` já está em
  `.gitignore:51`. Alternativa descartada: versionar `plans/<slug>/` e
  ignorar só `plans/*/.state/` — daria revisão do plano no PR, mas levaria
  ruído efêmero ao histórico de todo projeto derivado do template. Tradeoff
  aceito: o revisor de PR não lê o plano; o racional durável vive na spec e
  no ADR.
- **Fonte do plugin citada por URL canônica**: o marketplace está em mudança
  de propriedade, então os artefatos bakeados referenciam
  `https://github.com/mateusmacedo/plugins-claude` em vez de clone local.

## Verificação e testes

### Critérios de aceite

- [x] Scaffold Fase 1 existe e descreve ciclo de specs / rules / workflow /
  ADRs sem exigir o plugin instalado para ler a documentação
- [x] Nenhum arquivo bakeado instrui PR padrão para `main` como fluxo normal
- [x] Nenhuma skill de domínio do template foi removida ou sobrescrita
- [x] Onboarding declara fronteira bake vs consume do mmda-flow
- [x] `.claude/README.md` lista as três rules novas (`git-safety`,
  `comment-discipline`, `ephemeral-refs`)
- [x] `.github/PULL_REQUEST_TEMPLATE.md` existe e referencia base
  `develop`/`release`, sem itens de release-please/CodeRabbit
- [x] `docs/onboarding.md` documenta que `plans/` é local e não versionado
  (RF9 — opção B)
- [x] ADR de fechamento registra a fronteira bake vs consume e a decisão de
  `plans/` (RF12)
- [x] Nenhum artefato bakeado contém path absoluto `/home/...` (NFR3)
- [x] CI do template continua verde (markdown-only não quebra `nx affected`)

### Cenários de teste

1. **DADO** um clone fresco do template **QUANDO** o leitor abre
   `docs/specs/README.md` e `docs/rules/README.md` **ENTÃO** entende como
   criar spec/regra sem consultar o repositório do plugin
2. **DADO** `docs/guides/development-workflow.md` **QUANDO** comparar com
   `AGENTS.md` **ENTÃO** ambos descrevem o mesmo fluxo develop→release→master
3. **DADO** skills homônimas no plugin e no template **QUANDO** inspecionar
   `.claude/skills/` **ENTÃO** o conteúdo de domínio do template permanece
4. **DADO** ausência do plugin mmda-flow **QUANDO** rodar
   `pnpm nx affected -t lint,typecheck,test,build --exclude=@nx-base-template/source`
   **ENTÃO** a suíte não depende de hooks/scripts do plugin

<critical_constraints>
- [P0] NUNCA forkar runtime do plugin (hooks, skill-init/sync, config-sync)
- [P0] NUNCA importar PR→main como fluxo padrão
- [P0] NUNCA sobrescrever skills de domínio do template
- [P0] Manter docs/adr/ (não renomear para docs/decisions/)
</critical_constraints>

## Escopo fora

- **Portar hooks de hygiene / code-guardian / tracker-pr-guard**: runtime do
  plugin; consumo via instalação, não bake
- **Portar skill-planner, skill-feature-pipeline, skill-pr-review-reply,
  skill-prompt-boost, etc.**: permanecem no plugin
- **Alterar plugins-claude**: esta spec só muda o template
- **Migrar ADRs existentes para outro path ou schema**
- **Adotar Linear/Jira mandatory fields no template**
- **Criar apps, libs ou código de produto**: a entrega é documental
  (markdown + rules); `apps/` e `libs/` permanecem intactos

## Checklist de qualidade da spec

- [x] Seções obrigatórias presentes
- [x] Sem `[TODO]` / `[TBD]` / seções vazias
- [x] Constraints em sandwich (início e final)
- [x] Linguagem imperativa nos requisitos
- [x] Escopo fora com justificativa
- [x] ≥ 3 cenários de teste
- [x] Critérios de aceite mensuráveis
