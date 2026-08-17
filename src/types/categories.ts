export type CategoryNode = {
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  event_count?: number;
  children?: CategoryNode[];
};

export type CategoriesResponse = {
  items: CategoryNode[];
};
