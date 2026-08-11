---
id: SPEC-BG2K2W30
slug: destravar-release-gitea-actions
title: Destravar o pipeline de release do template no Gitea Actions
stage: building
priority: P1
depends_on: []
ticket_url: https://lider-cap.atlassian.net/browse/ARQ-462
subtask_urls: []
created: 2026-08-11
---

# SPEC-BG2K2W30: Destravar o pipeline de release do template no Gitea Actions

## Resumo

O workflow `Release` versiona as libs compartilhadas corretamente, mas não consegue empurrar o resultado para o remoto: o Gitea recusa as três refs (`master` e as duas tags de versão) porque o token efêmero das Actions não pertence a nenhum time autorizado nas whitelists de proteção. Como mantenedor do template, quero que o release conclua de ponta a ponta com uma identidade de automação explicitamente autorizada, para que as libs voltem a ser versionadas e publicadas sem intervenção manual e sem enfraquecer as proteções que valem para pessoas.

## Contexto

- **Problema**: o run 4803 (job 6300, disparado pelo merge do PR #4 de `release/0.0.1` para `master`) falhou no step `Nx Release (skip publish)` com exit code 1. O `nx release` executou bump `0.0.1` para `0.0.2` nas duas libs, gerou changelogs, commitou e criou as tags — e foi recusado no push com `pre-receive hook declined` nas três refs. Nenhuma tag jamais existiu no remoto, e as libs seguem em `0.0.1`.
- **Impacto**: enquanto não for resolvido, nenhuma lib do template pode ser versionada nem publicada, e o fluxo de release descrito no ADR-004 permanece inoperante. O template deixa de cumprir uma das funções que documenta.
- **Causa raiz**: o release escreve em três refs protegidas usando uma identidade que não está em nenhuma whitelist. A branch protection de `master` tem `enable_push_whitelist: true` com os times `Owners` e `tech-leads`; a tag protection #1012, com `name_pattern: "*"`, cobre toda e qualquer tag e admite apenas `Owners`. Ambas têm `whitelist_usernames` vazio. O ator do push é o token efêmero das Actions do Gitea, que não é membro de nenhum time da organização — logo, não existe caminho pelo qual seja aceito. O bloqueio é de identidade, não de conteúdo: um mantenedor pertencente a `Owners` executaria o mesmo push sem rejeição.
- **Causa contribuinte**: o `release.yml` foi escrito assumindo que o step `Nx Release (skip publish)` apenas versiona, e que o push seria feito pelo step dedicado `Push version commit and tags`. O que liga o push automático, porém, é a chave `changelog.projectChangelogs.createRelease` do `nx.json` — o `nx release` deriva `shouldPush` da presença dela, não de um default do comando. Com `createRelease: "github"` declarado, o push saiu de dentro do step de versionamento e o step dedicado nunca executou.
- **Obstáculo latente**: a mesma chave faz o Nx tentar se comunicar com `api.github.com` a respeito de um repositório que existe apenas no Gitea. O Nx Release oferece os providers `github`, `github-enterprise-server` e `gitlab` — não há provider para Gitea. Removê-la resolve as duas coisas de uma vez, e por isso as duas edições do `nx.json` ficam acopladas: declarar `release.git.push: false` mantendo `createRelease` faz o Nx abortar com `GIT_PUSH_FALSE_WITH_CREATE_RELEASE`.
- **Obstáculo adicional**: a mensagem de commit do release carrega `[skip ci]`. No Gitea, as skip strings são avaliadas contra o commit apontado pela tag, então o push das tags de versão não dispararia o `publish-libs.yml` — o pipeline concluiria verde e nada seria publicado no Verdaccio.
- **Links relevantes**:
  - `docs/adr/004-workflows-verdaccio-release.md` — separação entre versionamento e publicação no Verdaccio
  - `docs/adr/005-plataforma-gitea.md` — decisão de plataforma e suas implicações
  - `AGENTS.md` — seção "Git e release" (branches protegidas, fluxo git-flow)
  - `plans/references/ANALISE-RELEASE-4803.md` — relatório técnico da investigação (não versionado; `plans/` está no `.gitignore`)
- **Referências externas**:
  - Run que falhou: https://gitea.lidercap.com.br/lidercap-apps/nx-base-template/actions/runs/4803
  - Ticket de trabalho: https://lider-cap.atlassian.net/browse/ARQ-462

<constraints>
- [P0] NUNCA enfraquecer as proteções que valem para contribuidores humanos: `required_approvals: 2`, as whitelists de times e a tag protection permanecem intactas.
- [P0] NUNCA conceder ao token de CI permissão de `Owner` na organização — a autorização deve ser por nome de usuário, com o menor escopo que resolve.
- [P0] Segredos NUNCA são versionados: o `RELEASE_TOKEN` existe apenas como secret do Gitea, referenciado por expressão no workflow.
- [P0] NUNCA usar `--no-verify` para contornar validação. Neutralizar o `pre-push` do Lefthook no runner via `LEFTHOOK: "0"` escopado ao step de push é admitido: o hook roda `nx affected` de quatro targets já executados no CI do PR, e a validação segue valendo integralmente para quem trabalha localmente.
- [P1] O push ao remoto DEVE acontecer em exatamente um step do workflow, e esse step DEVE ser `Push version commit and tags`.
</constraints>

## Requisitos

### Funcionais

- [ ] **[P0] Autorizar a identidade de automação nas refs protegidas**: o usuário `ci-runner-bot` DEVE ter permissão base `Code: Write` no repositório e constar em `push_whitelist_usernames` da branch protection de `master` e em `whitelist_usernames` da tag protection #1012 (pattern `*`).
  - A permissão base é pré-requisito das whitelists, não consequência delas: o Gitea avalia a ACL do usuário sobre o repositório ANTES das allowlists de proteção. Hoje o bot está apenas no time `desenvolvedores` com permissão `none`, e nem constar nas whitelists nem portar um PAT de escopo `write:repository` eleva essa ACL — o escopo restringe o que o token faz, não o que o usuário pode.
  - A autorização é por nome de usuário, não por promoção a time.
  - Configuração feita no painel do Gitea ou via API autenticada como `Owner` — fora do repositório, portanto não versionável.
  - Edge case: se `ci-runner-bot` for removido da organização, o release volta a falhar com a mesma mensagem; o relacionamento DEVE estar registrado no ADR.
- [ ] **[P0] Prover o token da automação ao workflow**: um token pessoal de `ci-runner-bot` com escopo `write:repository` DEVE existir como secret `RELEASE_TOKEN`, e o `actions/checkout` do step `Checkout master` DEVE usá-lo no lugar de `secrets.GITHUB_TOKEN`.
- [ ] **[P0] Separar versionamento de push**: a chave `changelog.projectChangelogs.createRelease` DEVE ser removida do `nx.json` e `"push": false` DEVE ser declarado no bloco `release.git`, na mesma edição. Remover `createRelease` é o que de fato desliga o push do `nx release` — e elimina o provider incompatível; `push: false` entra como guardrail contra a reintrodução do comportamento. O step `Push version commit and tags` volta a ser o único ponto de escrita no remoto, com `--atomic` para preservar a semântica all-or-nothing das três refs.
  - As duas chaves são inseparáveis: `push: false` mantendo `createRelease` faz o Nx abortar com `GIT_PUSH_FALSE_WITH_CREATE_RELEASE`.
  - Nenhum dos providers suportados pelo Nx (`github`, `github-enterprise-server`, `gitlab`) atende ao Gitea.
  - Os arquivos `CHANGELOG.md` continuam sendo gerados, versionados e commitados — comportamento já observado no run 4803.
- [ ] **[P0] Restaurar o gatilho da publicação**: o `[skip ci]` DEVE sair de `release.git.commitMessage`, que passa a ser `chore(release): publish`. No Gitea, a skip string é avaliada contra o commit apontado pela tag e impediria o `publish-libs.yml` de disparar.
  - A remoção não cria recursão: nenhum workflow do repositório dispara em `push` para `master` — `release.yml` dispara em `pull_request`/`workflow_dispatch` e `ci.yml` em `pull_request`.
- [ ] **[P1] Registrar a decisão**: um ADR em `docs/adr/` DEVE documentar a identidade de automação do release, por que a autorização é por nome e não por time, e a ausência de provider Gitea no Nx Release.

### Não-funcionais

- [ ] Segurança: nenhuma permissão administrativa sobre a organização DEVE ser concedida ao CI. A permissão base do bot DEVE ficar restrita ao repositório `nx-base-template`, e as whitelists o autorizam apenas em `master` e nas tags. O escopo `write:repository` do PAT, porém, não é granular por ref nem por repositório: ele cobre operações de escrita onde quer que o bot tenha acesso, e o `actions/checkout` o persiste no runner até o post-job. Essa superfície residual é trade-off aceito e está registrada no ADR-008; reduzi-la (`persist-credentials: false`, credencial escopada ao step de push, expiração e rotação do PAT) fica para iteração posterior.
- [ ] Compatibilidade: as mudanças DEVEM funcionar com Nx `23.1.0`, pnpm `11.14.0` e Node `^24`, conforme as versões fixadas no workspace.
- [ ] Reversibilidade: as três frentes (plataforma, `nx.json`, `release.yml`) DEVEM ser revertíveis de forma independente entre si. Dentro do `nx.json`, porém, `createRelease` e `push` são acopladas e revertem juntas — reverter apenas uma reintroduz o push indevido ou o erro `GIT_PUSH_FALSE_WITH_CREATE_RELEASE`.

## Camadas afetadas

| Camada | Afetada? | Descrição |
|--------|----------|-----------|
| Configuração do workspace (`nx.json`) | [x] | `changelog.projectChangelogs.createRelease` é removida; `release.git.push` passa a `false`; `[skip ci]` sai do `commitMessage` |
| CI/CD (`.github/workflows/`) | [x] | `release.yml` passa a usar `secrets.RELEASE_TOKEN` no checkout e reforça o step de push com `--atomic` |
| Plataforma (Gitea) | [x] | Whitelists de branch e tag protection recebem `ci-runner-bot`; secret `RELEASE_TOKEN` criado — fora do repositório |
| Documentação (`docs/adr/`) | [x] | ADR registrando a identidade de automação e a ausência de provider Gitea |
| Libs (`libs/shared/*`) | [ ] | Nenhuma mudança de código; apenas voltam a ser versionadas pelo pipeline |
| Apps | [ ] | Não há apps no template |

## Localização de código

```text
nx-base-template/
  nx.json                          — configuração do Nx Release
  .github/workflows/release.yml    — workflow de versionamento
  docs/adr/                        — decisões arquiteturais
  docs/specs/                      — esta spec
```

**Arquivos a modificar**:

- `nx.json` — remover `changelog.projectChangelogs.createRelease`; adicionar `"push": false` em `release.git`; remover `[skip ci]` do `commitMessage`
- `.github/workflows/release.yml` — trocar `token: ${{ secrets.GITHUB_TOKEN }}` por `token: ${{ secrets.RELEASE_TOKEN }}` no step `Checkout master`; acrescentar `--atomic` e `LEFTHOOK: "0"` ao step `Push version commit and tags`; remover as envs `GITHUB_TOKEN`/`GH_TOKEN` do step de versionamento e o `env` de nível de job
- `docs/adr/008-identidade-automacao-release.md` — ADR novo (numeração seguinte ao ADR-007)
- `docs/adr/README.md` — linha do ADR-008 no índice

**Configuração externa** (não versionável, executada no Gitea):

- Branch protection `master` — `push_whitelist_usernames` recebe `ci-runner-bot`
- Tag protection #1012 (pattern `*`) — `whitelist_usernames` recebe `ci-runner-bot`
- Secret `RELEASE_TOKEN` — token pessoal de `ci-runner-bot` com escopo `write:repository`

## Design

### Arquitetura

```text
Fluxo atual (quebrado)                Fluxo corrigido
──────────────────────                ───────────────
checkout (GITHUB_TOKEN)               checkout (RELEASE_TOKEN)
        │                                     │
nx release --skip-publish             nx release --skip-publish
  ├─ version                            ├─ version
  ├─ changelog                          ├─ changelog
  ├─ commit                             ├─ commit
  ├─ tag                                ├─ tag
  └─ push  ◄── RECUSADO                 └─ (push desabilitado)
        │                                     │
  [step nunca executa]           git push --follow-tags --atomic  ◄── ACEITO
                                              │
                                        publish-libs.yml
```

### Fluxo principal

1. Merge de PR `release/*` ou `hotfix/*` para `master` dispara o workflow `Release`.
2. `Checkout master` autentica com `RELEASE_TOKEN`, gravando o header de credencial usado nas operações git subsequentes.
3. `Nx Release (skip publish)` resolve o bump pelos Conventional Commits, escreve os manifestos, gera changelogs, commita e cria as tags — sem empurrar.
4. `Push version commit and tags` executa `git push --follow-tags --atomic origin master`, com `LEFTHOOK: "0"` no step. O pre-receive do Gitea reconhece `ci-runner-bot` nas whitelists e aceita as três refs.
5. As tags criadas disparam `publish-libs.yml`, que publica no Verdaccio conforme o ADR-004.

### Ordem de aplicação

A configuração no Gitea é pré-requisito das mudanças de código: sem ela, o workflow continua falhando no mesmo ponto, apenas em outro step. A ordem recomendada é configurar as whitelists e o secret primeiro, validar com uma tag descartável, e só então mergear as mudanças de `nx.json` e `release.yml`.

## Decisões técnicas

- **Autorizar `ci-runner-bot` por nome de usuário**: escolhido porque concede exatamente a permissão necessária — push em `master` e criação de tags neste repositório — preservando `required_approvals: 2` e as whitelists de times para pessoas.
  Alternativa descartada: adicionar o bot ao time `Owners`, porque concederia poder administrativo sobre toda a organização a um token de CI, muito além do necessário.
- **Reutilizar `ci-runner-bot` em vez de criar um usuário novo**: escolhido porque o usuário já existe na organização (id 57, hoje apenas no time `desenvolvedores` com permissão `none`), evitando proliferação de identidades de automação.
  Alternativa descartada: criar um `release-bot` dedicado, porque um segundo bot de CI só se justifica se as permissões precisarem divergir — o que não é o caso hoje.
- **Desligar o push do Nx em vez de remover o step dedicado**: escolhido porque alinha o código à intenção já declarada nos comentários do `release.yml` e concentra a escrita no remoto em um ponto único, mais simples de diagnosticar e de tornar idempotente. O desligamento vem da remoção do `createRelease`; `push: false` fica como guardrail.
  Alternativa descartada: manter o push dentro do `nx release` e remover o step, porque a falha voltaria a ocorrer no meio do comando, com commit e tags já criados e sem controle sobre a retentativa.
- **Remover `createRelease` em vez de trocar de provider**: escolhido porque o Nx Release não oferece provider para Gitea e nenhum dos existentes (`github`, `github-enterprise-server`, `gitlab`) aponta para o servidor correto.
  Alternativa descartada: criar releases via API do Gitea no mesmo escopo, porque mistura a correção do push com uma capacidade nova; fica registrado em Escopo fora.

## Regras relacionadas

- `.claude/rules/git-safety.md` — branches protegidas, revisão antes do commit, proibição de segredos versionados
- `.claude/rules/process-enforcement.md` — plano aprovado para mudanças que tocam 2+ arquivos
- `docs/adr/004-workflows-verdaccio-release.md` — separação entre versionamento e publicação
- `docs/adr/005-plataforma-gitea.md` — implicações de operar no Gitea em vez do GitHub

## Verificação e testes

### Critérios de aceite

- [ ] `ci-runner-bot` consegue empurrar uma tag descartável para o repositório, e a tag é removida em seguida.
- [ ] O workflow `Release` conclui com `conclusion: success`, com o commit de versão presente em `master` e as tags `{projectName}@{version}` visíveis em `GET /api/v1/repos/lidercap-apps/nx-base-template/tags`.
- [ ] O push ao remoto ocorre exclusivamente no step `Push version commit and tags`; o step `Nx Release (skip publish)` não emite a linha `NX Pushing to git remote "origin"`.
- [ ] O `publish-libs.yml` é disparado pelas tags geradas.
- [ ] `GET /repos/lidercap-apps/nx-base-template/branch_protections` continua reportando `required_approvals: 2` e os times `Owners` e `tech-leads` nas whitelists.
- [ ] Validação do projeto passando: `pnpm biome ci .` e `pnpm nx affected -t lint,typecheck,test,build --exclude=@nx-base-template/source`.

### Cenários de teste

```text
DADO que ci-runner-bot consta nas whitelists de branch e tag protection
  E que nx.json define release.git.push como false
QUANDO um PR de release/* é mergeado para master
ENTÃO o workflow Release conclui com sucesso
  E o commit de versão e as tags {projectName}@{version} existem no remoto

DADO que nenhuma tag {projectName}@{version} existe no repositório
QUANDO o step Nx Release (skip publish) executa
ENTÃO a flag --first-release é aplicada
  E o changelog de cada lib é gerado a partir do histórico completo

DADO que ci-runner-bot NÃO consta nas whitelists
QUANDO o step Push version commit and tags executa
ENTÃO o push é recusado com pre-receive hook declined
  E o job falha sem deixar commit nem tag no remoto, porque o push é atômico
```

<critical_constraints>
- [P0] NUNCA enfraquecer as proteções que valem para contribuidores humanos: `required_approvals: 2`, as whitelists de times e a tag protection permanecem intactas.
- [P0] NUNCA conceder ao token de CI permissão de `Owner` na organização — a autorização deve ser por nome de usuário, com o menor escopo que resolve.
- [P0] Segredos NUNCA são versionados: o `RELEASE_TOKEN` existe apenas como secret do Gitea, referenciado por expressão no workflow.
- [P0] NUNCA usar `--no-verify` para contornar validação. Neutralizar o `pre-push` do Lefthook no runner via `LEFTHOOK: "0"` escopado ao step de push é admitido: o hook roda `nx affected` de quatro targets já executados no CI do PR, e a validação segue valendo integralmente para quem trabalha localmente.
- [P1] O push ao remoto DEVE acontecer em exatamente um step do workflow, e esse step DEVE ser `Push version commit and tags`.
</critical_constraints>

## Escopo fora

- **Criação de releases no Gitea via API**: substituir o `createRelease` removido por um step que chame `POST /api/v1/repos/{owner}/{repo}/releases` é capacidade nova, não correção do push. Pertence a uma spec própria, depois que o pipeline estiver verde.
- **Publicação no Verdaccio**: o `publish-libs.yml` já existe e não muda; esta spec apenas restaura o gatilho (as tags) que o alimenta.
- **Release de imagens Docker**: os steps `Detect docker release candidates` e `Release — docker apps` permanecem como estão. O template não tem apps com `tag:type:app`, então eles seguem sendo pulados.
- **Revisão das regras de proteção do repositório**: a tag protection com pattern `*` restrita a `Owners` é ampla — cobre toda e qualquer tag deste repositório, e não apenas as de release. Avaliar se esse escopo é o desejado é discussão de plataforma, fora desta correção.
- **Automação da configuração do Gitea**: versionar as regras de proteção como código (Terraform ou script idempotente) é melhoria de plataforma, não requisito para destravar o release.

## Checklist de qualidade da spec

- [x] Todas as seções obrigatórias presentes e preenchidas
- [x] Sem `[TODO]`, `[TBD]` ou seções vazias
- [x] Constraints em XML tags
- [x] Sandwich: constraints repetidas no final
- [x] Linguagem imperativa
- [x] Escopo fora com justificativa
- [x] Paths exatos na Localização de código
- [x] Camadas afetadas identificadas
- [x] Cenários de teste: 3 (happy path, edge case do primeiro release, erro esperado)
- [x] Critérios de aceite mensuráveis
