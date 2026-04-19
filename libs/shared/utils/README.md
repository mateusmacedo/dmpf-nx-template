# @lideranca-sites/shared-utils

Biblioteca de utilitarios compartilhados para manipulacao de strings e objetos.

## O que esta biblioteca exporta

- `toKebabCase`, `toCamelCase`, `isBlank` em `lib/string.utils`
- `omitNullish`, `isPlainObject` em `lib/object.utils`

## Exemplo de uso

```ts
import {
  isBlank,
  omitNullish,
  toCamelCase,
  toKebabCase,
} from '@lideranca-sites/shared-utils';

const label = toKebabCase('Hello World');
const field = toCamelCase('user-name');
const empty = isBlank('   ');
const payload = omitNullish({ a: 1, b: null, c: undefined });
```

## Publicacao

Este pacote e publicado no GitHub Packages no escopo `@lideranca-sites`.
