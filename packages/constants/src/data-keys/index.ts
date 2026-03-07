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
      lookup: ['admin', 'customers', 'lookup'] as const,
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
      children: (tagGroupId: string, parentTagId: string | null) =>
        ['admin', 'tags', 'children', tagGroupId, parentTagId ?? 'root'] as const,
    },
    taxonomy: {
      lookup: ['admin', 'taxonomy', 'lookup'],
      tree: ['admin', 'taxonomy', 'tree'],
    },
    priceLists: {
      list: ['admin', 'priceLists', 'list'],
      detail: (id: string) => ['admin', 'priceLists', 'detail', id] as const,
    },
    customerGroups: {
      list: ['admin', 'customerGroups', 'list'],
      detail: (id: string) =>
        ['admin', 'customerGroups', 'detail', id] as const,
    },
    evaluationJobs: {
      list: ['admin', 'evaluationJobs', 'list'],
      detail: (id: string) =>
        ['admin', 'evaluationJobs', 'detail', id] as const,
      entityHistory: (entityType: string, entityId: string) =>
        ['admin', 'evaluationJobs', 'entityHistory', entityType, entityId] as const,
    },
    warehouses: {
      list: ['admin', 'warehouses', 'list'],
      detail: (id: string) => ['admin', 'warehouses', 'detail', id] as const,
      lookup: ['admin', 'warehouses', 'lookup'],
    },
    stores: {
      list: ['admin', 'stores', 'list'] as const,
      detail: (id: string) => ['admin', 'stores', 'detail', id] as const,
    },
    platformInstallation: {
      detail: ['admin', 'platform-installation', 'detail'] as const,
    },
    domainSpaces: {
      list: ['admin', 'domain-spaces', 'list'] as const,
    },
    storeHostBindings: {
      list: (storeId?: string) =>
        storeId
          ? (['admin', 'store-host-bindings', 'list', storeId] as const)
          : (['admin', 'store-host-bindings', 'list'] as const),
    },
  },
  locations: {
    countries: ['locations', 'countries'],
    states: (countryId: string) => ['locations', 'states', countryId] as const,
    cities: (params: { stateId?: string; countryId?: string }) =>
      ['locations', 'cities', params] as const,
    districts: (cityId: string) =>
      ['locations', 'districts', cityId] as const,
    towns: (districtId: string) =>
      ['locations', 'towns', districtId] as const,
  },
} as const;
