import { apiRequest } from './client';
import type { CategoriesResponse } from '../types/categories';

export function fetchCategories(signal?: AbortSignal) {
  return apiRequest<CategoriesResponse>({
    path: '/categories',
    signal,
  });
}
