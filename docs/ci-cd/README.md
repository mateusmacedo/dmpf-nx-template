# CI/CD — guia de adoção

Este diretório **não** descreve um pipeline ativo. Ele descreve o modelo de CI/CD
adotado pela organização e o que você precisa preencher para ligá-lo no projeto
gerado a partir deste template.

Tudo entre `<` e `>` é placeholder: substitua pelos valores do seu projeto antes
de usar. Nenhum identificador real de infraestrutura (conta, path de parâmetro,
namespace, nome de secret) é versionado aqui — e não deve passar a ser.

## O que já vem pronto e o que falta

| Item | Estado no template |
| --- | --- |
| CI em PR (`ci.yml`) | **Ativo** — job `Escopo`, Nx affected de lint/typecheck/test/build/e2e (sem `tag:stack:go`), job `template-smoke` e o agregador `CI`, check obrigatório da `develop` |
| CI Go do DMPF (`dmpf-ci.yml`) | **Ativo** — saída do `init` do `@mateusmacedo/dmpf-plugin`; no template sem módulo Go, vermelho quando o diff toca dependências ou o `go.work` (`modsync --check`), e fora dos checks obrigatórios (addendum da ADR-011) |
| Versionamento e publish de libs | **Ativo** — `create-release.yml`, `nx-release.yml` (publica no GitHub Packages pelo `publish-libs.yaml`) e `nx-publish-libs.yml` (republicação manual) |
| CD (`cd-dev-hmg.yml`) | **Template** — só `workflow_dispatch`, parametrizado por placeholder |
| Manifestos GitOps | **Ausentes** — vivem no repositório de infraestrutura, não aqui |
| Variáveis e secrets de deploy | **Ausentes** — configurados no repositório do projeto |

Separação rígida: **CI não faz deploy**; **CD não substitui o CI**.

## Esteira de CI por etapa

| Etapa | O que roda |
| --- | --- |
| `pre-commit` (Lefthook) | `biome check --write` e `gofmt -l` nos arquivos em stage |
| `pre-push` (Lefthook) | Uma invocação de `nx affected -t lint,typecheck,test,build`, com base no que o remoto já tem (`@{push}`, ou o merge-base com `origin/develop` na branch nova) |
| PR para `develop` ou `release/**` | `ci.yml`: o job `Escopo` classifica o diff; `Nx Affected Pipeline` (`biome ci` e `nx affected` de lint, typecheck, test, build e e2e, sem `tag:stack:go`) e `Template smoke (DMPF)` rodam quando há código; o job `CI` agrega o resultado. `dmpf-ci.yml`: job `DMPF`, que roda só o que o diff alcança e fica fora dos obrigatórios no template |
| PR só de documentação (`docs/**` e `*.md` fora de `tools/`, `.claude/` e `.agents/`) | Só o job `Escopo`; o `CI` aprova sem rodar o resto |
| PR para `master` (de `release/**` ou `hotfix/*`) | O mesmo `ci.yml` e o `dmpf-ci.yml`, com a `master` como base |
| Merge em `master` de `release/**` ou `hotfix/*` | `nx-release.yml`: versão, changelog e tags, release Docker quando há app fora de Go e publish das libs (`next` para pré-release, `latest` nos demais casos) |
| Agendado (`dmpf-agendado.yml`) | `conformance` e `govulncheck` toda segunda às 09:00 UTC, porque os dois reprovam sem diff; sem `go.mod` no workspace, passa sem rodar gate |
| `push` em `develop` ou `master` que muda dependência; agendado; manual (`cache-seed.yml`) | Semeia o cache do pnpm que os PRs leem da branch base |

O ruleset da `develop` exige só o job `CI`: pulado conta como aprovado, falha ou
cancelamento reprova. A `master` não tem check obrigatório; ela só recebe código já
validado pelo PR de release. O Nx Cloud fica desligado no template
(`neverConnectToCloud` no `nx.json`); o derivado se conecta depois de remover a flag.

## Modelo de referência

| Campo | Valor de referência |
| --- | --- |
| Organização dos manifestos CD | **Modelo A** — um workflow monorepo: `detect-apps` mais um job `deploy-<app>` por app, com `project`/`ecr` literais |
| Plataforma | EKS, com GitOps reconciliado por ArgoCD |
| Ambientes iniciais | `dev` e `hmg` |
| Nomenclatura de app | Sufixo terminal canônico `-bff` ou `-api` (nunca `-bff-api`) |
| Workflows reutilizáveis | Locais, em `.github/workflows/`: `detect-apps.yaml` vem pronto; `deploy-eks.yaml` é criado ao ligar o CD, com a infraestrutura do projeto |

Modelos B/C, CD de produção e outras plataformas estão em
[EXPANSION_MODELS.md](./EXPANSION_MODELS.md) — consulte antes de proliferar
workflows.

## Fluxo resumido

```text
PR  →  .github/workflows/ci.yml          (Nx affected: lint/typecheck/test/build/e2e + template-smoke)
    →  .github/workflows/dmpf-ci.yml     (projetos Go: workflow reutilizável do platform)
push develop / workflow_dispatch
    →  .github/workflows/cd-dev-hmg.yml  (Modelo A: detect → deploy-eks, um job por app)
        →  build/push da imagem no registry
        →  atualiza a tag da imagem no repositório de infraestrutura (Kustomize)
        →  ArgoCD reconcilia o cluster
```

## Documentos deste diretório

| Doc | Conteúdo |
| --- | --- |
| [DEPLOY_APPLICATIONS.md](./DEPLOY_APPLICATIONS.md) | Como habilitar o CD de uma app, mapa GitOps, secrets externos e troubleshooting |
| [EXPANSION_MODELS.md](./EXPANSION_MODELS.md) | Modelos de expansão (B, C, produção, ECS/on-prem, …) |

## Fontes externas

O template não depende de repositório externo de workflows: os reutilizáveis
ficam em `.github/workflows/`. O que fica fora é o repositório de
infraestrutura do seu projeto (manifestos GitOps, roles, secrets).

Paths GitOps típicos, no repositório de infraestrutura:

```text
EKS/environment/<projeto>/<env>/<project>/
EKS/applications/<projeto>/<env>-<project>.yaml
```

## Gatilhos CD (Modelo A)

| Evento | Ambiente | Comportamento |
| --- | --- | --- |
| `push` em `develop` | default `dev` | Detecta apps alteradas (`apps/` + `libs/` → todas com Dockerfile) e faz deploy |
| `workflow_dispatch` | choice `dev` \| `hmg` | Opcional: input `app` (`apps/<app>`); vazio = detect |

No template, o gatilho de `push` vem **desligado**: o `cd-dev-hmg.yml` nasce com
apenas `workflow_dispatch`, para que nenhum projeto novo faça deploy acidental
antes de a infraestrutura existir.

## Permissões típicas do manifesto CD

```yaml
permissions:
  id-token: write
  contents: read
```

Secrets de pipeline: `secrets: inherit`. Variáveis de **runtime** do pod vêm de
ConfigMap e de secrets externos definidos no repositório de infraestrutura — ver
[DEPLOY_APPLICATIONS.md](./DEPLOY_APPLICATIONS.md#secrets-externos).

## Outros workflows do monorepo

| Workflow | Papel |
| --- | --- |
| `.github/workflows/ci.yml` | CI em PR, com o job `template-smoke` |
| `.github/workflows/dmpf-ci.yml` | CI Go do DMPF, gerado pelo `init`; não editar à mão |
| `.github/workflows/create-release.yml` | Cria a branch `release/X.Y.Z`; o PR para `master` é aberto com a sua conta |
| `.github/workflows/nx-release.yml` | Versionamento (Nx Release) e publicação encadeada das libs no GitHub Packages |
| `.github/workflows/nx-publish-libs.yml` | Republicação manual das libs |
| `.github/workflows/publish-libs.yaml` / `detect-apps.yaml` | Reutilizáveis locais (`workflow_call`) |

Decisões relacionadas: [ADR-004](../adr/004-workflows-verdaccio-release.md) (split
version/publish) e [ADR-010](../adr/010-migracao-github-linear.md) (plataforma
GitHub, publicação no GitHub Packages e tracker Linear).
