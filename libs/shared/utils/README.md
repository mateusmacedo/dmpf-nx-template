# @lidercap-apps/shared-utils

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
} from '@lidercap-apps/shared-utils';

const label = toKebabCase('Hello World');
const field = toCamelCase('user-name');
const empty = isBlank('   ');
const payload = omitNullish({ a: 1, b: null, c: undefined });
```

## Publicacao

Este pacote é publicado no Verdaccio no escopo `@lidercap-apps`.
