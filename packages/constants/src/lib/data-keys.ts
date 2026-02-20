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
  },
} as const;
