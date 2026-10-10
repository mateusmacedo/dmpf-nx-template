export type SortOrder = 'asc' | 'desc';

export type SortInput<F = string> = {
  field: F;
  order: SortOrder;
};

export type PaginatedSortedResponse<T, F = string> = {
  items: T[];
  pagination: import('./pagination.types.js').PaginationMeta;
  sort: SortInput<F>;
};
