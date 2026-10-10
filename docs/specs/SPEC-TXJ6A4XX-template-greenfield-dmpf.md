---
id: SPEC-TXJ6A4XX
slug: template-greenfield-dmpf
title: Template greenfield DMPF — workspace pronto para consumir o DMPF por versão
stage: backlog
priority: P1
depends_on: [SPEC-317RXZ73]
ticket_url: https://linear.app/mmda/issue/DEVS-71/spec-txj6a4xx-template-greenfield-dmpf-workspace-pronto-para-consumir
subtask_urls: []
created: 2026-10-06
---

# SPEC-TXJ6A4XX: Template greenfield DMPF — workspace pronto para consumir o DMPF por versão

## Resumo

Transformar o `nx-base-template` na base de projetos greenfield que usam o
DMPF: kernel Go, `dmpf-conformance`, generator `bounded-context`, gates,
infra, CI e ativos de IA, todos recebidos **por versão** do plugin
`@mateusmacedo/dmpf-plugin`. Como mantenedor, quero criar um repositório a
partir do template, configurar o module path num comando e gerar o primeiro
bounded context já verde nos gates, sem copiar nada do platform.

**Bloqueio externo**: depende da SPEC-P846PH1P do repositório
`dmpf` (`github.com/mateusmacedo/dmpf`), que publica o plugin com
`init`, executors, migrations, ativos de IA e o workflow reutilizável. O campo
`depends_on` registra só a dependência local (SPEC-317RXZ73), porque o catálogo
só resolve IDs locais; esta spec não sai de `backlog` antes da primeira versão
publicada do plugin.

## Contexto

- **Problema**:
  - O template não tem nada de DMPF: nenhuma app ou lib, `go.work` com
    `go 1.25` (`go.work:1`) contra a diretiva `1.26.6` do platform, sem
    namedInput `go` no `nx.json`, sem `.golangci.yml`, sem gates, infra ou
    ativos de IA de bounded context.
  - A migração da plataforma (GitHub, GitHub Packages, Linear, repositório
    template) é feita pela SPEC-317RXZ73, pré-requisito local desta spec.
- **Impacto**: um projeto novo nasce de `gh repo create --template` e chega
  ao primeiro contexto verde em poucos comandos, sempre com as versões que o
  plugin declara compatíveis.
- **Inspiração**: repositórios template do GitHub; workspaces Nx que se
  atualizam com `nx migrate`.
- **Links relevantes**:
  - SPEC-P846PH1P (repo `dmpf`) — torna o DMPF consumível por
    versão; pré-requisito desta spec.
  - SPEC-317RXZ73 — migração para GitHub, GitHub Packages e Linear (ADR-010).
  - SPEC-7VQFX9RP — remoção das libs de exemplo (ADR-009).
  - ADR-002 (tasks e cache), ADR-007 (template autônomo), ADR-009 (sem libs
    de exemplo), ADR-010 (GitHub e Linear).

<constraints>
- [P0] Todo arquivo DMPF do template é saída do plugin (`init`) na versão
  fixada no `package.json`; nenhum arquivo DMPF é escrito ou editado à mão.
- [P0] Nenhuma app ou lib de exemplo no template (ADR-009); a prova de que o
  template gera projeto funcional é um job de CI que descarta o que gera.
- [P0] Token do GitHub Packages só por variável de ambiente ou secret; o
  `.npmrc` versionado não contém credencial.
- [P0] Kernel e plugin só se atualizam juntos, por `nx migrate`; nenhuma
  automação sobe um sem o outro.
- [P1] As stacks JS/TS atuais (Express, Nest, Next, Angular) e os agentes e
  rules genéricos de `.claude/` permanecem como estão.
</constraints>

## Requisitos

### Funcionais

**A. Bootstrap DMPF**

- [ ] **[P0] A1 — Workspace inicializado pelo plugin**: o template contém o
  resultado de `pnpm nx add @mateusmacedo/dmpf-plugin@<versão>` seguido de
  `pnpm nx g @mateusmacedo/dmpf-plugin:init --modulePrefix=example.com/change-me`:
  `dmpf.json`, `go.work`, configuração Go no `nx.json`, `.golangci.yml`,
  `infra/`, `.env.example`, baseline vazio, chamador de CI e ativos de IA.
  - `git diff` depois de rodar o mesmo `init` sobre o template é vazio.
- [ ] **[P0] A2 — Registry**: `.npmrc` com
  `@mateusmacedo:registry=https://npm.pkg.github.com` e
  `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}`.
  - Edge: `pnpm install` sem `NODE_AUTH_TOKEN` falha; o README explica como
    criar o token (`read:packages`) logo na seção de pré-requisitos.
- [ ] **[P0] A3 — Configuração do projeto novo**: o primeiro passo depois de
  criar o repositório é
  `pnpm nx g @mateusmacedo/dmpf-plugin:init --modulePrefix=<module path do projeto>`;
  enquanto o prefixo for `example.com/change-me`, o `bounded-context` recusa
  rodar (comportamento do plugin) e imprime esse comando.
- [ ] **[P1] A4 — Renovate em lockstep**: `renovate.json` ignora
  `@mateusmacedo/dmpf-plugin` e `github.com/mateusmacedo/dmpf/**`; a
  atualização desses itens acontece só por `nx migrate`.

**B. CI/CD no GitHub**

- [ ] **[P0] B1 — CI Go**: `.github/workflows/dmpf-ci.yml`, gerado pelo
  `init`, chama o workflow reutilizável do platform fixado por SHA; o
  `ci.yml` existente mantém o job de qualidade JS (`biome ci`,
  `nx affected -t lint,typecheck,test,build`) em runner hospedado pelo GitHub.
- [ ] **[P0] B2 — Smoke do template**: job `template-smoke` em todo PR gera um
  contexto descartável com `bounded-context` (1 agregado), roda `go build`,
  `go vet`, testes unitários, `conformance`, `modsync --check`,
  `infrasync --check` e context-check, e não commita nada.
- [x] **[P0] B3 — Sem Gitea e Verdaccio** (movido para a SPEC-317RXZ73): `nx-release.yml`,
  `nx-publish-libs.yml`, `create-release.yml` e `cd-dev-hmg.yml` rodam em
  runner hospedado pelo GitHub, usam `gh` e publicam libs TS no GitHub
  Packages; `rg -il 'gitea|verdaccio'` fora de `docs/adr/` e `docs/specs/`
  retorna 0 arquivos.
- [x] **[P1] B4 — Repositório template** (movido para a SPEC-317RXZ73): `master` e `develop` publicadas em
  `github.com/mateusmacedo/dmpf-nx-template`, repositório marcado como
  template (`isTemplate: true`) e com proteção de `master` e `develop`
  conforme o fluxo git-flow do `CONTRIBUTING.md`.

**C. Documentação**

- [ ] **[P0] C1 — README**: quickstart greenfield (criar via template, token,
  `pnpm install`, `init --modulePrefix`, primeiro `bounded-context`, gates,
  `nx migrate`); "Stack suportada" inclui Go/DMPF; "Convenção de tags" inclui
  `stack:go` e `layer:*`.
- [ ] **[P0] C2 — ADR-011 "O template consome o DMPF por versão"**: plugin como
  âncora única, GitHub Packages, ativos de IA pelo plugin, smoke em vez de app
  de exemplo.
- [x] **[P0] C3 — ADR de plataforma GitHub** (movido para a SPEC-317RXZ73, que a
  publica como ADR-010): supersede a
  ADR-005 e as partes de Gitea e Verdaccio das ADRs 004 e 008; ADRs antigas
  recebem o status de superseded, sem reescrever o histórico.
- [x] **[P1] C4 — Docs de processo sem Gitea** (movido para a SPEC-317RXZ73): `AGENTS.md`, `CONTRIBUTING.md`,
  `docs/onboarding.md`, `docs/ci-cd/*` e `docs/guides/development-workflow.md`
  descrevem GitHub e GitHub Packages.
- [ ] **[P1] C5 — Guia do primeiro contexto**:
  `docs/guides/primeiro-bounded-context.md`, curto, que remete ao guia de
  consumo do platform na versão fixada e cobre só o que é próprio do template.

### Não-funcionais

- [ ] Compatibilidade: Nx 23.x, Node 24, pnpm 11.14.0 e a diretiva Go do
  `versions.json` do plugin (1.26.6 hoje).
- [ ] Desempenho: `template-smoke` termina em até 15 min no `ubuntu-latest`
  com cache de Go e pnpm.
- [ ] Segurança: workflows com `permissions` mínimas (`contents: read`,
  `packages: read`); nenhum token em log ou arquivo versionado.

## Camadas afetadas

| Camada | Afetada? | Descrição |
|--------|----------|-----------|
| Configuração do workspace (`nx.json`, `go.work`, `package.json`, `.npmrc`, `renovate.json`) | [x] | Saída do `init`, registry e lockstep |
| Ferramentas Go (`.golangci.yml`, `tools/dmpf-baseline/`) | [x] | Saída do `init` |
| Infra (`infra/`) | [x] | Saída do `init` |
| CI/CD (`.github/workflows/`) | [x] | Chamador DMPF e smoke |
| Ativos de IA (`.claude/`, `.agents/`) | [x] | Ativos DMPF entram pelo `init`; o resto fica intacto |
| Documentação (`README.md`, `docs/`) | [x] | Quickstart, ADR-011, guia |
| Apps e libs | [ ] | Continuam vazias (ADR-009) |

## Localização de código

```text
nx-base-template/
  .npmrc                     — novo, registry GitHub Packages (A2)
  dmpf.json                  — novo, saída do init (A1)
  go.work, nx.json, .golangci.yml, .env.example — saída do init (A1)
  infra/                     — novo, saída do init (A1)
  tools/dmpf-baseline/       — novo, saída do init (A1)
  .claude/, .agents/skills/  — ativos DMPF da saída do init (A1)
  renovate.json              — regras de lockstep (A4)
  .github/workflows/         — dmpf-ci.yml (B1), ci.yml (B1, B2)
  docs/adr/011-template-consome-dmpf-por-versao.md — novo (C2)
  docs/guides/primeiro-bounded-context.md          — novo (C5)
  README.md, AGENTS.md, CONTRIBUTING.md, docs/onboarding.md, docs/ci-cd/* — (C1, C4)
```

**Arquivos a modificar**:

- `package.json` — devDependency `@mateusmacedo/dmpf-plugin` na versão fixada.
- `.github/workflows/ci.yml` — job `template-smoke` (B2).
- `docs/adr/README.md` — linha da ADR-011.

## Design

### Arquitetura

```text
github.com/mateusmacedo/dmpf (platform)          dmpf-nx-template (este repo)
  @mateusmacedo/dmpf-plugin@X ──npm.pkg.github──▶ package.json + saída do init
  dmpf-go-ci.yml@<sha> ◀──────── uses ─────────── .github/workflows/dmpf-ci.yml
  kernel vK ─────── proxy.golang.org ───────────▶ (só no projeto derivado, ao gerar contexto)
                                                          │ gh repo create --template
                                                          ▼
                                                  projeto greenfield
```

### Fluxo principal

1. `gh repo create <org>/<repo> --template mateusmacedo/dmpf-nx-template --clone`.
2. `export NODE_AUTH_TOKEN=<PAT com read:packages>` e `pnpm install`.
3. `pnpm nx g @mateusmacedo/dmpf-plugin:init --modulePrefix=github.com/<org>/<repo>`.
4. `pnpm nx g @mateusmacedo/dmpf-plugin:bounded-context` para o primeiro contexto.
5. PR: `ci.yml` e `dmpf-ci.yml` verdes.
6. Atualização: `pnpm nx migrate @mateusmacedo/dmpf-plugin@<nova>` e
   `pnpm nx migrate --run-migrations`.

## Decisões técnicas

- **Saída do `init` commitada no template**: o projeto derivado já nasce com
  infra, gates e ativos de IA, e o mesmo `init` reconfigura o module path.
  Alternativa descartada: template vazio que exige `init` completo no primeiro
  uso, que deixaria o template sem prova de que a versão fixada funciona.
- **Prefixo reservado `example.com/change-me`**: força a configuração antes do
  primeiro contexto. Alternativa descartada: prefixo do próprio template, que
  vazaria para módulos de projetos derivados sem erro.
- **Smoke no CI em vez de app de exemplo**: coerente com a ADR-009; prova o
  template a cada PR sem código a manter. Alternativa descartada: app de
  exemplo versionada.
- **Renovate fora do DMPF**: kernel e plugin andam em lockstep; um bump avulso
  quebraria a compatibilidade declarada em `versions.json`.
- **ADR própria para o consumo do DMPF (ADR-011)**: a decisão de plataforma já
  está na ADR-010; as duas têm ciclos de revisão distintos.

## Regras relacionadas

- `AGENTS.md` e `CONTRIBUTING.md` — fluxo git-flow e convenções do template.
- ADR-007 — template autônomo; o plugin DMPF é dependência versionada, não
  acoplamento ao repositório do plugin de processo.
- SPEC-P846PH1P (repo `dmpf`) — contrato do plugin consumido aqui.

## Verificação e testes

### Critérios de aceite

- [ ] `pnpm nx g @mateusmacedo/dmpf-plugin:init --modulePrefix=example.com/change-me` sobre o template produz `git diff` vazio.
- [ ] `go.work` com a diretiva Go de `versions.json` (1.26.6 hoje).
- [ ] `template-smoke` verde em PR, em até 15 min, sem arquivos novos versionados ao final.
- [ ] ADR-011 publicada.
- [ ] README com quickstart executado do zero em repositório criado pelo template, até o primeiro contexto verde.
- [ ] Validação do projeto passando: `pnpm biome ci .` e `pnpm nx run-many -t lint,typecheck,test,build`.

### Cenários de teste

```text
DADO um repositório criado a partir do template com NODE_AUTH_TOKEN válido
QUANDO roda pnpm install, init --modulePrefix=github.com/org/repo e bounded-context
ENTÃO o contexto compila, conformance sai com exit 0 e os go.mod requerem o
      kernel por tag, sem replace

DADO o template recém-clonado, ainda com o prefixo example.com/change-me
QUANDO roda bounded-context
ENTÃO o generator falha sem escrever arquivos e imprime o comando init

DADO um ambiente sem NODE_AUTH_TOKEN
QUANDO roda pnpm install
ENTÃO a instalação falha com erro de autenticação no npm.pkg.github.com, e o
      README indica como criar o token

DADO um PR qualquer no template
QUANDO o CI roda
ENTÃO template-smoke gera e verifica um contexto descartável e termina sem
      deixar arquivos versionados novos
```

<critical_constraints>
- [P0] Todo arquivo DMPF do template é saída do plugin (`init`) na versão
  fixada; nenhum arquivo DMPF é escrito ou editado à mão.
- [P0] Nenhuma app ou lib de exemplo (ADR-009); o smoke de CI descarta o que gera.
- [P0] Token do GitHub Packages só por variável de ambiente ou secret.
- [P0] Kernel e plugin só se atualizam juntos, por `nx migrate`.
- [P1] Stacks JS/TS atuais e agentes e rules genéricos de `.claude/`
  permanecem como estão.
</critical_constraints>

## Escopo fora

- **Mudanças no platform** (plugin, conformance, workflow reutilizável):
  pertencem à SPEC-P846PH1P.
- **App de exemplo**: ADR-009; a referência viva é o `bookings` do platform.
- **BFF e borda REST pública**: o primeiro contexto é gRPC; borda HTTP é spec
  própria.
- **Suíte de carga k6 e dashboards de carga**: ficam no platform.
- **BOM e certificação de produto**: ADR-059 do platform.
- **Alterar as stacks JS/TS atuais**: permanecem como estão.
- **Migrar projetos existentes**: a entrega vale só para projetos novos.
