# ADR-008: Identidade de automação do release e ajuste do Nx Release ao Gitea

## Status

Aceito — 2026-08-11. Implementa SPEC-BG2K2W30. Supersede parcialmente o
[ADR-004](./004-workflows-verdaccio-release.md): apenas os dois itens de
configuração do Nx Release listados na seção "Decisão". Os demais itens do
ADR-004 (split version/publish, alvo Verdaccio, runner `gitea-runner`) seguem
válidos, como já registrado no [ADR-005](./005-plataforma-gitea.md).

## Contexto

O workflow `Release` versionava as libs corretamente e falhava no push: o Gitea
recusava as três refs (`master` e as duas tags de versão) com `pre-receive hook
declined`. A branch protection de `master` autoriza os times `Owners` e
`tech-leads`; a tag protection de pattern `*` autoriza apenas `Owners`. Ambas
têm `whitelist_usernames` vazio, e o ator do push era o token efêmero das
Actions, que não pertence a time nenhum. O bloqueio era de identidade: o mesmo
push, feito por um mantenedor de `Owners`, passaria.

A investigação revelou dois problemas adicionais no caminho, ambos capazes de
manter o pipeline quebrado mesmo depois de resolver a identidade:

1. **O Nx Release não tem provider para Gitea.** O `nx.json` declarava
   `changelog.projectChangelogs.createRelease: "github"`, apontando para
   `api.github.com` a respeito de um repositório que existe apenas no servidor
   da organização. Os providers suportados são `github`,
   `github-enterprise-server` e `gitlab` — nenhum atende ao Gitea, conforme já
   registrado no ADR-005.
2. **`createRelease` é o que ligava o push automático.** O `nx release` deriva
   `shouldPush` da presença dessa chave, não de um default do comando. Por isso
   o push saía de dentro do step `Nx Release (skip publish)`, e o step dedicado
   `Push version commit and tags` nunca chegava a executar. As duas chaves são
   acopladas: declarar `release.git.push: false` mantendo `createRelease` faz o
   Nx abortar com `GIT_PUSH_FALSE_WITH_CREATE_RELEASE`.

Um terceiro obstáculo apareceu na revisão: a mensagem de commit do release
carregava `[skip ci]`. No Gitea, as skip strings são avaliadas contra o commit
apontado pela tag, então o push das tags de versão não dispararia o
`publish-libs.yml` — o pipeline concluiria verde e mesmo assim nada seria
publicado no Verdaccio.

Restrições que moldaram a decisão: o `gh` CLI não opera contra este servidor
(ADR-005); as proteções que valem para pessoas (`required_approvals: 2` e as
whitelists de times) não podiam ser enfraquecidas; e parte da correção é
configuração de plataforma, fora do repositório.

## Decisão

**A identidade de automação do release é o usuário `ci-runner-bot`, autorizado
por nome nas whitelists.** Ele é adicionado a `push_whitelist_usernames` da
branch protection de `master` e a `whitelist_usernames` da tag protection de
pattern `*`, sem ser promovido a nenhum time. Um token pessoal dele, com escopo
`write:repository`, vive como o secret `RELEASE_TOKEN` e é consumido pelo
`actions/checkout` do workflow, que o persiste para o push subsequente.

**O `nx.json` deixa de configurar release remota.** A chave
`changelog.projectChangelogs.createRelease` é removida — o que elimina a
tentativa de falar com `api.github.com` e, junto, o push automático do comando
agregado. `release.git.push: false` entra como guardrail explícito contra a
reintrodução do comportamento. As duas mudanças são inseparáveis, pelo
acoplamento descrito acima.

**O `[skip ci]` sai da mensagem de commit do release**, que passa a ser
`chore(release): publish`. Sem a string, o push das tags dispara o
`publish-libs.yml` como o ADR-004 previa. A remoção não cria recursão: nenhum
workflow do repositório dispara em `push` para `master` — o `release.yml`
dispara em `pull_request` e `workflow_dispatch`, e o `ci.yml` em
`pull_request`.

**O push acontece em um único step**, `Push version commit and tags`, com
`--atomic` para preservar a semântica all-or-nothing que o Nx aplicava ao
empurrar as três refs de uma vez.

**A permissão base de escrita é pré-requisito, não consequência das
whitelists.** No Gitea, a ACL do usuário sobre o repositório é avaliada antes
das allowlists de proteção. Constar nas whitelists e portar um PAT de escopo
`write:repository` não substitui `Code: Write` — o escopo restringe o que o
token pode fazer, não eleva o que o usuário pode. O `ci-runner-bot` precisa,
portanto, de acesso de escrita ao repositório além das duas entradas nas
whitelists.

**Itens do ADR-004 que esta decisão substitui**:

| Item do ADR-004 | Situação |
|-----------------|----------|
| "Manter no template: [...] `changelog.createRelease: github`" | Substituído: a chave é removida — não há provider Gitea, e é ela que ligava o push automático |
| "Manter no template: [...] `[skip ci]` no commit de release" | Substituído: a string sai do `commitMessage`, senão as tags não disparam o `publish-libs.yml` |
| "`createRelease: false` no changelog / Template mantém releases GitHub (`github`)", na matriz do que não foi portado | Substituído: o template deixa de configurar release remota |

## Alternativas descartadas

| Alternativa | Por que foi rejeitada |
| ----------- | --------------------- |
| Promover `ci-runner-bot` ao time `Owners` | Resolveria em um passo, mas daria poder administrativo sobre toda a organização a um token de CI — desproporcional ao que o release precisa. |
| Criar um `release-bot` dedicado | Um segundo bot de CI só se justifica quando as permissões precisam divergir, o que não é o caso; evita proliferação de identidades. |
| Manter o push dentro do `nx release` | Não é possível sem release remota: o comando agregado deriva `shouldPush` de `createRelease`, então preservar o push exigiria manter a chave — e com ela o provider incompatível e a chamada a `api.github.com`. Mesmo se fosse viável, a falha voltaria a ocorrer no meio do comando, com commit e tags já criados e sem controle sobre a retentativa. |
| Trocar o provider de `createRelease` em vez de removê-lo | Nenhum dos providers suportados aponta para o servidor correto; não há troca possível. |
| Criar releases via API do Gitea (`POST /api/v1/repos/{owner}/{repo}/releases`) | É capacidade nova, não correção do push. Fica para uma spec própria, depois que o pipeline estiver verde. |
| Usar `--no-verify` no push | Replicaria o que o Nx fazia, mas a spec proíbe contornar validação com a flag. O `pre-push` do runner é neutralizado de forma escopada ao step (`LEFTHOOK: "0"`), sem desabilitar hooks no repositório. |

## Consequências

**Positivas:**

- O release conclui de ponta a ponta sem enfraquecer nenhuma proteção: os times
  seguem nas whitelists e `required_approvals: 2` permanece.
- O push tem um ponto único de escrita no remoto, mais simples de diagnosticar
  e de tornar idempotente.
- Sem `createRelease`, o Nx para de tentar operações autenticadas contra um
  serviço que não hospeda este repositório: com o cliente de release remota
  desligado, ele nem chega a resolver `GITHUB_TOKEN`/`GH_TOKEN`. As duas envs
  saem do step de versionamento, e o `env` de nível de job também — os dois
  steps de Docker referenciam `secrets.GITHUB_TOKEN` diretamente e não
  dependiam dele.
- Com o `[skip ci]` removido, o `publish-libs.yml` volta a ser disparado pelas
  tags, restaurando o fluxo do ADR-004.

**Negativas:**

- **Existe uma dependência viva fora do repositório.** Se `ci-runner-bot` for
  removido da organização, perder a permissão base de escrita, ou sair de
  qualquer uma das duas whitelists, o release volta a falhar com a mesma
  mensagem. As whitelists não são versionadas como código, então essa
  configuração não é reproduzível a partir de um clone.
- O PAT do bot fica disponível no runner durante todos os steps posteriores ao
  checkout, incluindo `pnpm install`, lifecycle scripts permitidos e a execução
  de hooks — o `actions/checkout` o persiste na configuração do git até o
  post-job. O escopo `write:repository` não se limita a `master` e às tags deste
  repositório: cobre operações de escrita onde quer que o bot tenha acesso, e o
  bloco `permissions:` do workflow restringe o token efêmero das Actions, não
  este PAT. Se exfiltrado, segue válido depois do job. Reduzir a janela (via
  `persist-credentials: false` e credencial escopada ao step de push) e definir
  expiração e rotação ficam registrados como melhorias de segurança para uma
  iteração posterior.
- O repositório deixa de ter releases na interface da plataforma enquanto a
  criação via API do Gitea não for implementada; os `CHANGELOG.md` versionados
  seguem sendo a fonte de histórico.
- A branch protection de `master` só fica comprovada no primeiro release real:
  um teste com tag descartável exercita a tag protection e a autenticação do
  bot, mas não atualiza `master`.
