# Web App (apps/web)

Next.js 16 (App Router, Turbopack) · Mantine 8 · React Query 5 · Zustand 5 · next-intl

## Imports

- Mantine: `from '@mantine/core'`, `from '@mantine/hooks'`, `from '@mantine/dates'`
- Icons: `from 'lucide-react'`
- Forms: `from 'react-hook-form'` + `from '@/core/hooks/useTranslatedZodResolver'`
- Shared UI (MantineProvider, PhoneInput): `from '@org/ui'`, `from '@org/ui/inputs/phone-input'`
- Schemas: `from '@org/schemas/auth'`, `from '@org/schemas/common'`
- Constants: `from '@org/constants'`
- Types: `from '@org/types'`
- Internal alias: `@/` → `apps/web/` (e.g. `@/core/hooks/useAuth`)

**DO NOT** use `@org/ui/mantine/core`, `@org/ui/icons`, or `@org/ui/form` — these barrel re-exports were removed.

## Form Pattern

All forms follow this exact structure:

1. Import Zod schema + `InputType` / `OutputType` from `@org/schemas/*`
2. Use `useTranslatedZodResolver` (from `@/core/hooks/useTranslatedZodResolver`) instead of raw `zodResolver`:
   ```tsx
   const resolver = useTranslatedZodResolver(MySchema);
   const methods = useForm<InputType>({ resolver, defaultValues: {...} });
   ```
   This hook wraps `zodResolver` and auto-translates Zod V-key error messages (e.g. `validation.errors.common.name_required`) into the current locale via next-intl. **DO NOT** import `zodResolver` from `@hookform/resolvers/zod` directly — always use the translated wrapper.
3. Wrap every field in `<Controller control={control} name="field" render={({ field, fieldState }) => ...} />`
4. Show errors via `fieldState.error?.message` — no manual `te()` translation needed
5. On submit cast to output type: `data as OutputType`, pass to mutation

For nullable fields use `value={field.value ?? ''}` (TextInput) or `value={field.value ?? undefined}` (PhoneInput).

## Styling

**Tailwind CSS first.** Use Tailwind utility classes for all layout, spacing, colors, typography, and responsive design. Only fall back to Mantine's `styles` prop when Tailwind can't reach internal Mantine sub-elements (e.g. `styles={{ input: {...} }}`). Never use Mantine's `style` prop for things Tailwind handles.

### Dark / Light mode

The `dark:` variant is wired to Mantine's color scheme via `@custom-variant dark` in `global.css` — it targets `[data-mantine-color-scheme="dark"]`, not the system `prefers-color-scheme`. Always write both modes explicitly:

```tsx
// GOOD — explicit light + dark
<div className="bg-white dark:bg-[#0f1117]">
<p className="text-gray-900 dark:text-white">
<span className="text-gray-500 dark:text-gray-400">

// GOOD — dark:invert for SVG icons that must flip between light/dark
<Image src="/icons/github.svg" className="dark:invert" />

// BAD — hardcoded dark-only color with no light fallback
<div className="bg-[#0f1117]">

// BAD — Mantine style prop instead of Tailwind
<Box style={{ display: 'flex', padding: '48px' }}>
```

### Primary color palette

Mantine injects `--mantine-color-primary-0` … `--mantine-color-primary-9` at runtime. These are forwarded to Tailwind via `@theme` in `global.css`, so Tailwind utilities and Mantine props stay in sync:

```tsx
// Tailwind utility  ↔  Mantine prop — same color
<p className="text-primary-4">   ↔   <Text c="primary.4">
<div className="bg-primary-6">  ↔   <Box bg="primary.6">
```

Shade reference (light mode primary shade: 6, dark mode: 4):
- `primary-4` = `#34d399` — dark mode accent (links, icons)
- `primary-6` = `#059669` — light mode accent (buttons)

For Lucide icon colors use the CSS variable directly: `color="var(--mantine-color-primary-4)"`.

### When to use Mantine `styles` prop

Only for internal Mantine sub-elements that Tailwind's `className` cannot reach:

```tsx
// GOOD — Tailwind can't target the inner <input> element
<TextInput styles={{ input: { backgroundColor: '#1a1d2e' } }} />

// GOOD — cursor on Mantine Checkbox label sub-element
<Checkbox styles={{ label: { cursor: 'pointer' } }} />

// BAD — use Tailwind className instead
<Text style={{ color: '#6b7280' }}>
```

## Client vs Server Components

- **Server (default):** Layouts, static pages, presentational components without hooks
- **`'use client'`:** Forms, pages using `useRouter`/`useSearchParams`, components using `useTranslations`, providers

## Auth Flow

1. `proxy.ts` (middleware) verifies JWT → writes `X-User-*` request headers
2. Root layout reads headers → passes `TokenPayload` to `<AuthProvider>`
3. `AuthProvider` hydrates Zustand store once via `initializeUser()`
4. Client components access state: `useAuthStore((s) => s.user)`

## State Management

- **Server state:** React Query — mutation hooks in `core/hooks/`, query keys from `DATA_ACCESS_KEYS` (`@org/constants`)
- **Client state:** Zustand + immer in `core/stores/` — auth store: `useAuthStore`

## API Requests

- **Client-side:** `apiClient` (Axios, `baseURL: '/api'`, `withCredentials: true`). Auto-refreshes on 401. Errors normalized to `ApiError` (`core/lib/api/api-error.ts`).
- **Server-side (RSC):** `serverFetch()` (`core/lib/api/server-fetch.ts`). Reads token from cookies, hits `BACKEND_INTERNAL_URL` directly.

## i18n

- Use `useTranslations('namespace')` from `next-intl` (e.g. `useTranslations('common.auth')`)
- Locales: `en`, `tr` — files in `@org/i18n`
- Namespaces: `common.json`, `validation.json`

## File Structure

```
app/
  (route-group)/
    route-name/
      page.tsx
      components/
        ComponentName.tsx
core/
  hooks/          — React Query mutation/query hooks
  stores/         — Zustand stores
  providers/      — Client providers (auth, query)
  lib/api/        — Axios client, ApiError, server fetch
  i18n/           — next-intl config
```

## DataTable (AG-Grid)

Server-side paginated, filtered, sorted data tables. Uses AG-Grid Community (infinite row model) with Mantine theme integration.

**Reference implementation:** `apps/web/app/(admin)/admin/customers/page.tsx`

### Imports

```tsx
import {
  DEFAULT_TRANSLATIONS,
  DataTable,
  serializeGridQuery,
  useColumnFactory,
  type DataTableTranslations,
} from '@org/ui';
import type { IDatasource, IGetRowsParams } from 'ag-grid-community';
```

### Page Structure (5 steps)

Every DataTable page follows this exact pattern:

**1. Translations** — Map i18n keys to `DataTableTranslations`. Use `DEFAULT_TRANSLATIONS.filters` for built-in filter labels:

```tsx
const translations = useMemo<DataTableTranslations>(() => ({
  filters: DEFAULT_TRANSLATIONS.filters,
  columns: {
    name: t('table.name'),
    email: t('table.email'),
    // key must match the headerKey in createColumn
  },
  contextMenu: {
    view: t('contextMenu.view'),
    copy: t('contextMenu.copy'),
    copySelected: t('contextMenu.copySelected'),
    exportGroup: t('contextMenu.exportGroup'),
    exportCSV: t('contextMenu.exportCSV'),
    exportExcel: t('contextMenu.exportExcel'),
  },
}), [t]);
```

**2. Column definitions** — Use `useColumnFactory(translations)` to get `createColumn<TData>(field, options)`:

```tsx
const { createColumn } = useColumnFactory(translations);

const columns = useMemo(() => [
  // Text — searchable column with debounced input filter
  createColumn<MyType>('email', { headerKey: 'email', type: 'text', minWidth: 200 }),

  // Badge + Enum filter — dropdown filter for enum fields
  createColumn<MyType>('role', {
    headerKey: 'role',
    type: 'badge',
    colorMap: { ADMIN: 'red', USER: 'blue' },
    enumOptions: [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'USER', label: 'User' },
    ],
  }),

  // Boolean — yes/no dropdown filter
  createColumn<MyType>('emailVerified', { headerKey: 'emailVerified', type: 'boolean' }),

  // Datetime — date picker filter with equals/after/before/between ops
  createColumn<MyType>('createdAt', { headerKey: 'createdAt', type: 'datetime', minWidth: 170 }),

  // Number — numeric filter with equals/gt/lt/between ops
  createColumn<MyType>('loginCount', { headerKey: 'loginCount', type: 'number', minWidth: 110 }),

  // Nested field (e.g. _count.sessions) — auto uses valueGetter, not sortable
  createColumn<MyType>('_count.sessions', { headerKey: 'sessions', type: 'number' }),
], [createColumn]);
```

Column types: `text` | `number` | `boolean` | `date` | `datetime` | `currency` | `percentage` | `badge` | `locale` | `action`

- `badge` requires `colorMap`. Add `enumOptions` to enable dropdown filter; without it filter is disabled.
- `text`, `boolean`, `date`, `datetime`, `number` have built-in server-side filters.
- `action` is pinned right, no sort/filter.
- `currency` requires `currency: 'USD'` (or any ISO code).

**3. Datasource** — Use `serializeGridQuery()` to convert AG-Grid params to a structured query object. Send via POST:

```tsx
const datasource = useMemo<IDatasource>(() => ({
  getRows: async (params: IGetRowsParams) => {
    try {
      const query = serializeGridQuery({
        startRow: params.startRow,
        endRow: params.endRow,
        filterModel: params.filterModel,
        sortModel: params.sortModel,
      });

      const res = await apiClient.post<PaginatedResponse<MyType>>(
        '/admin/my-endpoint/query',
        query,
      );

      params.successCallback(res.data.data, res.data.pagination.total);
    } catch {
      params.failCallback();
    }
  },
}), []);
```

`serializeGridQuery` returns `DataQueryParams` (`{ page, limit, filters?, sort? }`). Backend endpoint is `POST /admin/<entity>/query` with JSON body.

**4. Context menu** (optional) — Right-click actions:

```tsx
contextMenu={{
  enabled: true,
  onView: (row) => router.push(`/admin/items/${row.id}`),
  showView: true,
  showCopy: true,
  showExportCSV: true,
  showExportExcel: true,
  // customItems: [{ key: 'delete', label: 'Delete', onClick: ... }],
}}
```

**5. Render** — `DataTable` is generic, pass the data type:

```tsx
<DataTable<MyType>
  columns={columns}
  datasource={datasource}
  translations={translations}
  height="calc(100vh - 200px)"
  contextMenu={contextMenuConfig}
/>
```

### Backend Wiring

For each entity that uses DataTable, the backend needs:

1. **Field config** in `packages/types/src/admin/<entity>/index.ts`:
   ```ts
   import type { FieldFilterConfig } from '@org/types/data-query';
   export const MY_FIELD_CONFIG = {
     name:    { filterType: 'text' },
     role:    { filterType: 'enum', values: ['ADMIN', 'USER'] },
     active:  { filterType: 'boolean' },
     count:   { filterType: 'number' },
     created: { filterType: 'date' },
   } as const satisfies Record<string, FieldFilterConfig>;
   export const MY_SORT_FIELDS = ['name', 'role', 'created'] as const;
   ```

2. **Zod schema** in `packages/schemas/src/admin/<entity>/`:
   ```ts
   import { createDataQuerySchema } from '../../data-query/index.js';
   export const MyQuerySchema = createDataQuerySchema({
     fields: MY_FIELD_CONFIG,
     sortFields: MY_SORT_FIELDS,
   });
   ```

3. **Service** uses `buildPrismaQuery()` from `apps/backend/src/core/utils/prisma-query-builder.ts`:
   ```ts
   const { where, orderBy, skip, take } = buildPrismaQuery({
     page, limit, filters, sort,
     defaultSort: { field: 'createdAt', order: 'desc' },
   });
   ```

### Rules

- **DO NOT** build query body manually in datasource — always use `serializeGridQuery()`
- **DO NOT** use GET for data queries — always use `apiClient.post('/admin/<entity>/query', query)`
- **DO NOT** use `search` param for text filtering — each column filters independently via `filters` object
- All DataTable pages must be `'use client'`
- Wrap `columns` and `datasource` in `useMemo` to prevent unnecessary re-renders
- `headerKey` in `createColumn` must match a key in `translations.columns`

## Notes

- Middleware file is `proxy.ts` (not `middleware.ts`)
- CSS layers: `theme, base, mantine, components, utilities`
- PostCSS: Tailwind + Mantine preset work together
- `@org/source` custom condition enables direct TS source imports from monorepo packages in dev
- OAuth buttons use `next/image` with SVGs from `/public/icons/`
