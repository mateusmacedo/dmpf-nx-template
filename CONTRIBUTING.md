# Guia de Contribuição

Obrigado por contribuir com este template. Este documento descreve o fluxo de
trabalho, os padrões de código e como enviar mudanças.

## Pré-requisitos

- Node.js `24` (ver `.nvmrc`)
- pnpm `11` (habilite via `corepack enable`)

```bash
corepack enable
pnpm install
```

O `pnpm install` instala as dependências e registra os hooks de git via Lefthook
(script `prepare`).

## Fluxo de trabalho

1. Crie uma branch a partir de `master` seguindo o padrão `tipo/descricao-curta`
   (ex: `feat/notificacoes-webhook`, `fix/lint-shared-utils`).
2. Faça commits atômicos seguindo Conventional Commits (ver abaixo).
3. Rode a validação local antes de abrir o PR.
4. Abra o Pull Request contra `master` descrevendo o que muda e por quê.

## Conventional Commits

As mensagens de commit seguem o padrão [Conventional Commits](https://www.conventionalcommits.org):

```text
<tipo>(<escopo>): <descrição no imperativo>
```

Tipos comuns: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`.
O escopo é o projeto Nx afetado (ex: `shared-utils`, `workspace`).

Exemplo: `feat(shared-utils): adicionar helper de agrupamento`

O versionamento e o changelog são derivados desses commits pelo Nx Release.

## Validação local

Prefira sempre rodar as tarefas via `nx`:

```bash
pnpm nx affected -t lint typecheck test build   # apenas o que mudou
pnpm nx run-many -t lint typecheck test build    # tudo
```

O hook de `pre-commit` roda `biome check --write` nos arquivos em stage; o de
`pre-push` roda `lint`, `typecheck`, `test` e `build` nos projetos afetados.

## Padrões de código

- **Lint e formatação**: Biome (`biome.json`). Rode `pnpm format` para formatar.
- **TypeScript**: Project References com `nodenext` (ver `tsconfig.base.json`).
- **Tags obrigatórias**: todo `project.json` declara uma tag de cada dimensão
  (`type:`, `scope:`, `stack:`) — ver `README.md`.
- **Testes**: Jest com SWC.

## Reportar problemas

Abra uma issue descrevendo o comportamento esperado, o observado e os passos
para reproduzir. Para vulnerabilidades de segurança, siga o `SECURITY.md`.
