export interface BasePagination {
  skip?: number;
  take?: number;
}

export interface BaseSorting {
  sort?: string;
  order?: 'asc' | 'desc';
}
