import { useQuery } from '@tanstack/react-query';

import { fetchCategories } from '../api/categories';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => fetchCategories(signal),
    enabled,
  });
}
