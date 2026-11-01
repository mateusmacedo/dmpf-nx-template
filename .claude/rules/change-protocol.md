# Protocolo de alterações

Como conduzir uma mudança neste repositório, do pedido à validação. As proteções de git e
de testes estão em `git-safety.md` e `testing-conventions.md`; os padrões de código, em
`code-patterns.md`; o processo de spec e plano, em `process-enforcement.md`.

## Níveis de regra

| Nível | Significado | Exemplo |
| --- | --- | --- |
| **Duro** | Não negociável; envolve segurança, integridade ou trabalho alheio | Autorização explícita para commit/push |
| **Recomendado** | Default esperado; pode ser ajustado com justificativa | Padrão arquitetural adotado |
| **Opcional** | Melhoria útil quando couber | Remoção proativa de código morto |

Em conflito entre instruções, prevalecem os arquivos de configuração efetivos
(`package.json`, `pnpm-workspace.yaml`, `lefthook.yml`, `biome.json`, `nx.json`,
`tsconfig.base.json`).

## Escopo

- Para pedidos explícitos, faça só o que foi pedido.
- Problema adjacente pequeno e evidente: corrija junto e mencione.
- Problema adjacente médio: mencione e pergunte antes de aplicar.
- Problema adjacente grande: registre para uma tarefa separada.
- Refatoração fora do escopo pedido depende de autorização.

## Antes de implementar

1. Identifique a categoria da tarefa.
2. Leia as skills relacionadas em `.claude/skills/` (domínio) e `.agents/skills/`
   (Nx e workspace).
3. Consulte `docs/` e os ADRs.
4. Busque implementações similares no repositório e reuse quando fizer sentido;
   duplicação sem motivo vira dívida.

Declarar o que foi consultado ajuda na revisão. Ao usar API, SDK ou ferramenta pouco
familiar, leia a documentação oficial antes; se algo não ficar claro, pergunte em vez de
inferir.

## Execução

1. **Análise**: entenda o impacto e os arquivos envolvidos (`pnpm nx show projects`, o
   grafo, os consumidores das libs).
2. **Execução**: aplique a alteração mínima suficiente.
3. **Validação**: rode a cadeia de validação (`process-enforcement.md`). Em tarefa de
   interface, verifique o resultado visualmente quando houver ferramenta; se não houver,
   pergunte como proceder.

Delegue a agentes ou skills quando a tarefa envolver vários arquivos, decisão
arquitetural ou conhecimento específico (segurança, NestJS, E2E). Ajuste pontual se faz
direto.

## Testes

- Função com lógica não trivial costuma ter teste associado, no padrão do projeto
  (Jest + SWC, `*.spec.ts` colocalizado, E2E sob `apps/*-e2e`).
- Em componente de UI, avalie o custo-benefício; na dúvida, pergunte.

## Organização e textos

- Utilitário específico de um consumidor pode ficar colocalizado com ele; mova para
  `libs/` quando dois ou mais módulos de pastas ou apps diferentes dependerem dele.
- Dados estáticos de configuração podem ir para um módulo próprio quando isso melhorar a
  leitura.
- Texto visível ao usuário final (labels, placeholders, mensagens) segue a ortografia do
  idioma alvo; em PT-BR, preserve a acentuação.

## Glossário

| Termo | Definição |
| --- | --- |
| **Lógica complexa** | Critério ajustável; por exemplo, múltiplos estados derivados ou efeitos colaterais interligados |
| **Alteração mínima** | Mudança restrita ao necessário para cumprir o pedido |
| **Código morto** | Funções, componentes ou flags sem uso efetivo |
| **Regra dura** | Comportamento não negociável (segurança, integridade, trabalho alheio) |
| **Affected** | Conjunto de projetos Nx impactados pela mudança em relação à base Git |
