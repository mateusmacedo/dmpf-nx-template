# ADR-004: Split version/publish e alvo Verdaccio

## Status

Aceito — 2026-07-20. Implementa SPEC-W4RWD02M.

## Contexto

A SPEC-YWAWQHPX reativou CI/release no template, mas o `release.yml` ainda
versionava e publicava no mesmo job (GitHub Packages). O monorepo de referência
`lidercap-platform` separa versionamento (`nx release --skip-publish` + push de
tags) da publicação no Verdaccio (`publish-libs.yml` via reusable em
`actions-templates`). Esta evolução alinha o template a esse modelo sem portar
identidade de runner/plataforma do lidercap.

Fecha o follow-up de portabilidade de registry mencionado no ADR-003, no recorte
Verdaccio (não cobre migração de runner nem Gitea).

## Decisão

- **`release.yml` version-only**: checkout `ref: master`,
  `pnpm nx release --skip-publish` (com `--first-release` quando não há tags
  `*@*`), `git push --follow-tags origin master`. Removido setup
  `npm.pkg.github.com` / `NODE_AUTH_TOKEN` do job de versionamento.
- **`publish-libs.yml`**: dispara em tags `**@*` e `workflow_dispatch`; chama
  `lidercap-apps/actions-templates/.github/workflows/publish-libs.yaml@main`
  com Node 24 / pnpm 11, `nx_exclude: @nx-base-template/source`,
  `scope: @lidercap-apps`, `build_projects_filter: tag:type:lib`.
- **Manter no template**: Docker GHCR + `release-type`, bot GitHub,
  `create-release.yml` via `gh`, runner `k8s-actions-runner`, pins 24/11,
  `changelog.createRelease: github`, `[skip ci]` no commit de release.
- **Sem `publishConfig` nas libs**: parity com lidercap; registry vem do auth
  do reusable. Risco conhecido: package names usam `@Lidercap-apps` (casing)
  enquanto o caller passa `scope: @lidercap-apps` — se publish falhar por
  scope, ajustar em follow-up.

### Matriz do que NÃO foi portado

| Item do lidercap | Motivo de não portar |
|------------------|----------------------|
| Runner `gitea-runner` | Identidade do template é GitHub + `k8s-actions-runner` |
| Node 22 / pnpm 9 | Template pinado em 24/11 (ADR-003) |
| API Gitea no create-release | Template hospedado no GitHub; manter `gh pr create` |
| `createRelease: false` no changelog | Template mantém releases GitHub (`github`) |
| Publish inline / loop `npm publish` | Preferir reusable Nx; criar/alterar reusable em `actions-templates` é follow-up se `@main` falhar |
| Auth/publish GitHub Packages | Substituído por Verdaccio |

## Consequências

- Versionamento fica idempotente em relação ao registry: falha de publish não
  impede tags/changelog.
- Consumidores do template precisam do reusable `publish-libs.yaml` acessível
  em `lidercap-apps/actions-templates@main` e da role/SSM de auth Verdaccio
  configurada na org.
- Docker release permanece no mesmo workflow de versionamento (vantagem do
  template ausente no lidercap).
- CI estrutural (`ci.yml`) e create-release não mudam nesta entrega.

## Referências

- Spec: `docs/specs/SPEC-W4RWD02M-evoluir-workflows-com-lidercap.md`
- ADR-003 (hardening / follow-up de registry)
- Referência: `lidercap-platform/.github/workflows/{release,publish-libs}.yml`
