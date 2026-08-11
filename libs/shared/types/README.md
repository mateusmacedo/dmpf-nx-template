# @lidercap-apps/shared-types

Biblioteca de tipos compartilhados para contratos de API e paginacao.

## O que esta biblioteca exporta

- `ApiResponse<T>` e `ApiError` em `lib/api.types`
- `PaginationInput`, `PaginationMeta` e `PaginatedResponse<T>` em `lib/pagination.types`

## Exemplo de uso

```ts
import type { ApiResponse, PaginatedResponse } from '@lidercap-apps/shared-types';

type User = { id: string; name: string };

const response: ApiResponse<PaginatedResponse<User>> = {
  data: {
    items: [{ id: '1', name: 'Mateus' }],
    pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
  },
};
```

## Publicacao

Este pacote é publicado no Verdaccio no escopo `@lidercap-apps`.
