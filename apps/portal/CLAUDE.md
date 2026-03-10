# CLAUDE.md — Portal (Next.js Admin Dashboard)

## Commands

```bash
npx nx dev portal             # dev server on :3000
npx nx build portal           # production build (standalone output)
npx nx lint portal
npx nx typecheck portal
```

## Provider Chain

Root layout wraps everything in this order (see `app/layout.tsx`):

```
QueryProvider (React Query — staleTime: 60s, gcTime: 5m)
  → AuthProvider (initializes Zustand user from x-user-* headers)
    → NextIntlClientProvider (next-intl messages)
      → MantineProvider (custom theme, primary: #5c69ac)
        → Notifications
          → ModalsProvider
            → LocaleProvider (DatesProvider for date locale)
```

## Route Groups

- `(auth)/` — Login page, unauthenticated
- `(admin)/` — Protected admin pages with AppShell sidebar. Middleware in `proxy.ts` handles JWT verification, token refresh, and redirect to `/auth` on failure.

Dynamic routes use `[id]` where `id === 'new'` means create, otherwise edit.

## Auth Flow

**Middleware (`proxy.ts`):**

1. Verify access token (JWT from httpOnly cookie)
2. If expired → try refresh via `BACKEND_INTERNAL_URL/api/admin/auth/refresh`
3. If refresh succeeds → update cookies, inject `x-user-*` headers for RSC
4. If no auth on protected route → redirect to `/auth?callbackUrl=...`
5. If authenticated on `/auth` → redirect to `/`

**Client-side:** Zustand store (`core/stores/auth.store.ts`) with `user`, `isAuthenticated`, `setUser`, `clearUser`, `logout`.

## API Clients

**Client-side** (`core/lib/api/api-client.ts`):

- Base URL: `NEXT_PUBLIC_API_URL` (env var)
- Auto-refresh on 401 → retries original request
- On refresh failure → clears Zustand store, redirects to `/auth`

**Server-side** (`core/lib/api/server-fetch.ts`):

- Base URL: `BACKEND_INTERNAL_URL` (internal Docker URL)
- Forwards access token from cookies + `Accept-Language` header
- On 401 → redirects to `/auth?tab=login`

## Creating a List Page (DataTable)

Reference: `app/(admin)/products/brands/page.tsx`

```tsx
'use client';

const t = useTranslations('frontend.admin.brands');
const tFilters = useTranslations('frontend.dataTable.filters');

// 1. Build translation objects for DataTable
const translations = useMemo<DataTableTranslations>(() => ({
  filters: { reset: tFilters('reset'), text: {...}, date: {...}, ... },
  columns: { name: t('table.name'), isActive: t('table.isActive'), ... },
  contextMenu: { view: ..., copy: ..., exportCSV: ..., exportExcel: ... },
  footer: { totalRows: t.raw('footer.totalRows'), ... },
  ...
}), [t, tFilters]);

// 2. Define columns with useColumnFactory
const { createColumn } = useColumnFactory(translations);
const columns = useMemo(() => [
  createColumn<EntityType>('name', { headerKey: 'name', type: 'text', minWidth: 200 }),
  createColumn<EntityType>('isActive', { headerKey: 'isActive', type: 'boolean' }),
  createColumn<EntityType>('createdAt', { headerKey: 'createdAt', type: 'date' }),
], [createColumn]);

// 3. Search hook
const { search, setSearch, searchParam } = useTableSearch({ fields: ['name'] });

// 4. IDatasource for ag-grid infinite row model
const datasource = useMemo<IDatasource>(() => ({
  getRows: async (params) => {
    const query = serializeGridQuery({
      startRow: params.startRow, endRow: params.endRow,
      filterModel: params.filterModel, sortModel: params.sortModel,
      search: searchParam,
    });
    const res = await apiClient.post('/admin/brands/query', query);
    params.successCallback(res.data.data, res.data.pagination.total);
  },
}), [searchParam]);

// 5. Render
return (
  <DataTable<EntityType>
    tableId="brands"
    columns={columns}
    datasource={datasource}
    translations={translations}
    height="calc(100vh - 180px)"
    showFilterDrawer
    contextMenu={{ enabled: true, onView: ..., onExportCSV: ..., ... }}
  />
);
```

Column types: `text`, `boolean`, `number`, `date`. Export via `downloadExport()` to `POST /admin/{resource}/export`.

## Creating a Form Page

Reference: `app/(admin)/products/brands/[id]/page.tsx`

```tsx
'use client';

// 1. Fetch data (skip for 'new')
const { data, isLoading } = useAdminBrand(id);
const saveBrand = useSaveBrand({ onSuccess, onError });

// 2. Image upload hook
const { deletingIds, isUploading, deleteImage, uploadFiles } = useImageUpload({
  basePath: `/admin/brands/${brandId}/images`,
});

// 3. Form setup — ALWAYS use useTranslatedZodResolver
const resolver = useTranslatedZodResolver(BrandSchema);
const methods = useForm<BrandInput>({
  resolver,
  defaultValues: NEW_BRAND_DEFAULT_VALUES,
  values: formattedData, // switches to fetched data when ready
});

// 4. Submit: upload files → merge → mutate
const onSubmit = async (formData) => {
  const uploadResults = await uploadFiles(formData.images ?? []);
  const allExisting = [...existingFiles, ...uploadResults].map((f, i) => ({
    id: f.id,
    url: f.url,
    sortOrder: i,
  }));
  await saveBrand.mutateAsync({
    ...formData,
    images: undefined,
    existingImages: allExisting,
  });
  router.push('/products/brands');
};

// 5. Render with FormProvider + FormCard sections
return (
  <FormProvider {...methods}>
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormCard title={t('generalInfo')} icon={FileText} iconColor="blue">
        <Controller
          name="translations.0.name"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              label={t('name.label')}
              error={fieldState.error?.message}
              required
            />
          )}
        />
      </FormCard>
      <FormCard title={t('media.title')} icon={ImageIcon} iconColor="grape">
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <Dropzone
              value={field.value}
              onChange={field.onChange}
              existingFiles={existingFiles}
              onRemoveExisting={handleRemove}
              deletingIds={deletingIds}
              loading={isUploading}
            />
          )}
        />
      </FormCard>
    </form>
  </FormProvider>
);
```

Key rules:

- Always `useTranslatedZodResolver` — never raw `zodResolver`
- Use `FooSchema` (frontend version with `images` field), not `BackendFooSchema`
- `NEW_FOO_DEFAULT_VALUES` exported from schema package for `defaultValues`
- Slug auto-generation: watch name field → `slugify(name, 'tr')` → `setValue('slug', ...)`

## React Query Hooks

All hooks live in `core/hooks/useAdmin{Resource}.ts`. Pattern:

```tsx
// Query — fetch single item
export const useAdminBrand = (id: string) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.brands.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: () => apiClient.get(`/admin/brands/${id}`).then((r) => r.data),
  });

// Mutation — create/update
export const useSaveBrand = (options?) =>
  useMutation({
    mutationFn: (data) =>
      apiClient.post('/admin/brands/save', data).then((r) => r.data),
    onSuccess: (result, _, __, context) => {
      context.client.removeQueries({
        queryKey: DATA_ACCESS_KEYS.admin.brands.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.brands.list,
      });
      options?.onSuccess?.(result);
    },
  });
```

Query keys from `@org/constants/data-keys`. Mutations invalidate list queries and remove detail cache on success.

## i18n

Portal loads two namespaces (see `core/i18n/request.ts`):

- `validation` — from `packages/i18n/src/locales/{locale}/validation.json`
- `frontend` — from `packages/i18n/src/locales/{locale}/portal.json`

Usage: `useTranslations('frontend.admin.brands')` → `t('title')` maps to `portal.json > frontend > admin > brands > title`.

For parameterized text (e.g., DataTable footer counts): use `t.raw('footer.totalRows')`.

## Component Placement Rule

**Page-specific components** → `app/(admin)/{route}/components/` (not reusable outside that route)

**Generic / reusable UI components** → `packages/ui/src/` (shared across portal, storefronts, etc.)

> Example: `DrawerFooter`, `DrawerWithFooter`, custom Mantine compound extensions — these belong in `packages/ui`, NOT in a route's `components/` folder.

## UI Conventions

- **Layout:** Mantine `AppShell` with collapsible navbar + responsive header
- **Icons:** lucide-react (Tag, Save, FileText, ImageIcon, Building2, etc.)
- **Forms:** `FormCard` sections with `icon` + `iconColor` props
- **Tables:** ag-grid infinite row model, viewport-height filling
- **Modals:** `modals.openConfirmModal()` for delete confirmations
- **Notifications:** `notifications.show({ color: 'red', message })` for errors
- **Loading:** `isLoading` → `<LoadingOverlay />`, mutations → `Button loading={isPending}`
- **Sticky sidebar:** `position: sticky, top: var(--mantine-spacing-md)` on desktop, normal flow on mobile
- **Grid pages:** Mantine `SimpleGrid` with responsive `cols` for card layouts (e.g., stores page)

## Navigation

Defined in `core/config/navigation.ts` as `adminNavItems: NavItem[]`. Groups: main, commerce, marketing, system. Each item has `key`, `icon`, `href`, `visibility` ('navbar'|'spotlight'|'both'), `description`. Spotlight (command palette) searches all items.

## Environment Variables

| Variable               | Side   | Purpose                                           |
| ---------------------- | ------ | ------------------------------------------------- |
| `JWT_SECRET`           | Server | Middleware token verification                     |
| `NEXT_PUBLIC_API_URL`  | Client | Browser API calls (can be relative)               |
| `BACKEND_INTERNAL_URL` | Server | Server-side fetch (absolute, internal Docker URL) |
