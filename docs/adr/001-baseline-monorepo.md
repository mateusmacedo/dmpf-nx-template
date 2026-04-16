# ADR-001: Baseline do Monorepo Multistack

**Status:** Aceito
**Data:** 2026-04-16

## Contexto

Precisamos de um workspace Nx capaz de hospedar apps Express, Fastify, NestJS,
Next.js e Angular no mesmo repositório, compartilhando libs TypeScript puras,
libs NestJS, libs React/Next e libs Angular.

## Decisão

Criar um baseline a partir do preset `--preset=ts` (neutro), adicionando todos
os plugins necessários de forma controlada, em vez de herdar convenções de um
preset focado em framework (nest, next, angular).

### Fundamentos técnicos escolhidos

| Decisão                                           | Justificativa                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `preset=ts` como ponto de partida                 | Menor acoplamento inicial; tsconfig correto gerado de início                                |
| `module: "nodenext"` no tsconfig.base             | ESM moderno, compatível com Node.js LTS                                                     |
| `composite: true` + `emitDeclarationOnly`         | TypeScript Project References — typecheck incremental                                       |
| `emitDecoratorMetadata` **fora** do tsconfig.base | Evita conflito com Angular compiler; cada app NestJS configura no próprio tsconfig.app.json |
| `customConditions` **fora** do tsconfig.base      | Evita conflito cross-stack; configurado por projeto quando necessário                       |
| pnpm-workspace com `apps/*`, `libs/**`, `tools/*` | Todos os pacotes são workspace packages reais (`workspace:^`)                               |
| `@nx/enforce-module-boundaries` com tagging 3D    | Governança por `type:`, `scope:`, `stack:`                                                  |
| SWC como transformador de testes                  | Velocidade superior ao ts-jest; suporte a decorators via `.spec.swcrc`                      |
| `project.json` externos (não inline)              | Melhor para generators automatizados e diffs legíveis                                       |
| `@nx/docker` no nx.json                           | Targets docker:build e docker:run disponíveis para qualquer app Node                        |

## Consequências

- Cada nova stack adicionada deve seguir o roadmap de fases documentado
- `emitDecoratorMetadata` e `experimentalDecorators` são responsabilidade de cada app NestJS
- Angular e Next.js entram na Fase 2 (após validação das stacks Node)
- Todos os projetos nascem com tags obrigatórias (type, scope, stack)
- ESLint com module boundaries é enforced em CI desde o primeiro commit
