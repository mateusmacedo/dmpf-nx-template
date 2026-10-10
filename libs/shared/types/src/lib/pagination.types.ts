/** Parâmetros de entrada para listagens paginadas. */
export type PaginationInput = {
  page: number;
  pageSize: number;
};

/** Metadados retornados em listagens paginadas. */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Resposta paginada genérica. */
export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};
