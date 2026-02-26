export const DATA_ACCESS_KEYS = {
  auth: {
    login: ['auth', 'login'],
    register: ['auth', 'register'],
    logout: ['auth', 'logout'],
  },
  admin: {
    customers: {
      list: ['admin', 'customers', 'list'],
      detail: (id: string) => ['admin', 'customers', 'detail', id] as const,
    },
    brands: {
      list: ['admin', 'brands', 'list'],
      detail: (id: string) => ['admin', 'brands', 'detail', id] as const,
      lookup: ['admin', 'brands', 'lookup'],
    },
    categories: {
      list: ['admin', 'categories', 'list'],
      detail: (id: string) => ['admin', 'categories', 'detail', id] as const,
      lookup: ['admin', 'categories', 'lookup'],
    },
    products: {
      list: ['admin', 'products', 'list'],
      detail: (id: string) => ['admin', 'products', 'detail', id] as const,
    },
    variants: {
      list: ['admin', 'variants', 'list'],
      detail: (id: string) => ['admin', 'variants', 'detail', id] as const,
      lookup: (q?: string) =>
        q
          ? (['admin', 'variants', 'lookup', q] as const)
          : (['admin', 'variants', 'lookup'] as const),
    },
    tags: {
      list: ['admin', 'tags', 'list'],
      detail: (id: string) => ['admin', 'tags', 'detail', id] as const,
      lookup: ['admin', 'tags', 'lookup'],
    },
    taxonomy: {
      lookup: ['admin', 'taxonomy', 'lookup'],
      tree: ['admin', 'taxonomy', 'tree'],
    },
  },
} as const;
