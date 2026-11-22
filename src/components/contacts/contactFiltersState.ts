export type ContactSort = 'recent' | 'name-asc' | 'name-desc' | 'company';
export type ContactSourceFilter = 'all' | 'manual' | 'bitrix24' | 'auto';

export interface ContactFiltersState {
  source: ContactSourceFilter;
  hasPhone: boolean;
  hasEmail: boolean;
  company: string | null;
  tag: string | null;
  sort: ContactSort;
}

export const defaultContactFilters: ContactFiltersState = {
  source: 'all',
  hasPhone: false,
  hasEmail: false,
  company: null,
  tag: null,
  sort: 'recent',
};
