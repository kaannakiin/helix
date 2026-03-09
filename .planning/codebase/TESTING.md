# Testing Patterns

**Analysis Date:** 2026-03-09

## Test Framework

**Runner:**
- Jest 30 via `@nx/jest` plugin
- Config: `jest.config.ts` (root), per-project `jest.config.cts` files
- Preset: `jest.preset.js` (wraps `@nx/jest/preset`)
- SWC transform: `@swc/jest` with per-project `.spec.swcrc` config

**Assertion Library:**
- Jest built-in `expect` (no additional assertion libraries)

**Run Commands:**
```bash
npx nx test backend          # Run backend unit tests
npx nx test utils            # Run utils package tests
npx nx e2e backend-e2e       # Run backend E2E tests
npx nx run-many -t test      # Run all unit tests across projects
```

## Test File Organization

**Location:**
- Co-located with source files (same directory as the code being tested)
- E2E tests in a separate project: `apps/backend-e2e/src/`

**Naming:**
- Unit/integration: `{name}.spec.ts` (e.g., `jwt-auth.guard.spec.ts`, `domain-utils.spec.ts`)
- E2E: `{feature}.spec.ts` organized by domain directories

**Structure:**
```
apps/backend/src/app/admin/auth/guards/
  ├── jwt-auth.guard.ts
  └── jwt-auth.guard.spec.ts

apps/backend/src/app/admin/stores/
  ├── domain-utils.ts
  ├── domain-utils.spec.ts
  ├── host-routing.service.ts
  └── host-routing.service.spec.ts

apps/backend-e2e/src/
  ├── auth/
  │   ├── login.spec.ts
  │   ├── register.spec.ts
  │   ├── refresh.spec.ts
  │   └── ...
  ├── storefront-auth/
  │   └── storefront-auth.spec.ts
  ├── stores/
  │   ├── domain-bindings.spec.ts
  │   └── ...
  └── support/
      ├── auth.helper.ts
      ├── admin.helper.ts
      ├── prisma.helper.ts
      ├── global-setup.ts
      ├── global-teardown.ts
      └── test-setup.ts
```

## Test Structure

**Suite Organization:**

Unit tests use flat `describe` with `it` blocks:

```typescript
describe('JwtAuthGuard', () => {
  const createContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips auth for storefront surface routes', () => {
    // arrange
    const reflector = { ... } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    // act & assert
    expect(guard.canActivate(createContext())).toBe(true);
  });
});
```

NestJS integration tests use `Test.createTestingModule`:

```typescript
describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(service.getData()).toEqual({ message: 'Hello API' });
    });
  });
});
```

**Patterns:**
- `beforeEach` for per-test setup (mocks, env vars, service instances)
- `afterEach` for cleanup: `jest.restoreAllMocks()`, restore `process.env`, restore globals
- Save and restore original values: `const originalEnv = process.env;` ... `process.env = originalEnv;`
- Helper factories at top of describe: `const createContext = () => ...`

## Mocking

**Framework:** Jest built-in (`jest.fn()`, `jest.spyOn()`, `jest.mock()`)

**Patterns:**

Manual mocking with `as unknown as` casts for partial implementations:

```typescript
const reflector = {
  getAllAndOverride: jest
    .fn()
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(STOREFRONT_AUTH_SURFACE),
} as unknown as Reflector;
```

Service dependency mocking with minimal interface:

```typescript
const redis = {
  del: jest.fn().mockResolvedValue(1),
};
const service = new HostRoutingService(
  {} as never,       // unused dependency
  {} as never,       // unused dependency
  redis as unknown as Redis
);
```

Global mock replacement:

```typescript
const fetchMock = jest.fn().mockResolvedValue({ ok: true });
global.fetch = fetchMock as unknown as typeof fetch;
```

Logger spy:

```typescript
const loggerWarnSpy = jest
  .spyOn(Logger.prototype, 'warn')
  .mockImplementation(() => undefined);
```

**What to Mock:**
- External services (Redis, fetch)
- NestJS framework internals (Reflector, ExecutionContext)
- Logger output
- `process.env` values

**What NOT to Mock:**
- Pure utility functions (test directly, as in `domain-utils.spec.ts`)
- The class under test
- Zod schemas (use real schemas for validation tests)

## Fixtures and Factories

**E2E Test Helpers:**

Located in `apps/backend-e2e/src/support/`:

```typescript
// auth.helper.ts — User creation/login helpers
export function createAuthClient(hostname?: string): AxiosInstance { ... }
export function uniqueEmail(): string { ... }
export function uniquePhone(): string { ... }
export async function registerUser(client, overrides) { ... }
export async function loginUser(client, email, password) { ... }
export async function registerAndGetCredentials(client, overrides) { ... }

// Storefront variants
export function createStorefrontClient(hostname: string): AxiosInstance { ... }
export async function registerCustomer(client, overrides) { ... }
export async function loginCustomer(client, email, password) { ... }
```

**Test Data:**
- `uniqueEmail()` generates `test-{timestamp}-{random}@e2e.test` for isolation
- `uniquePhone()` generates `+9055{random}` (Turkish mobile format)
- `DEFAULT_PASSWORD = 'TestPass123'` shared constant
- Each E2E test creates its own user via `registerAndGetCredentials()`

**Location:**
- `apps/backend-e2e/src/support/auth.helper.ts` — auth helpers
- `apps/backend-e2e/src/support/admin.helper.ts` — admin setup helpers
- `apps/backend-e2e/src/support/prisma.helper.ts` — direct database helpers

## E2E Test Setup

**Global Setup:**
- `apps/backend-e2e/src/support/global-setup.ts` — waits for backend server port to be open
- `apps/backend-e2e/src/support/global-teardown.ts` — cleanup
- `apps/backend-e2e/src/support/test-setup.ts` — sets `axios.defaults.baseURL` to `http://{host}:{port}`

**E2E Client Pattern:**
- Uses `axios` with `axios-cookiejar-support` for cookie-based auth
- Each test creates a fresh `createAuthClient()` for isolation (own cookie jar)
- `validateStatus: () => true` — never throws on HTTP errors; tests assert status codes

**Concurrency:**
- E2E tests run with `maxWorkers: 1` (sequential) because they share a database

## Coverage

**Requirements:** None enforced (no coverage thresholds configured)

**View Coverage:**
```bash
npx nx test backend --coverage
# Output: apps/backend/test-output/jest/coverage/
# or:     packages/utils/test-output/jest/coverage/
```

## Test Types

**Unit Tests:**
- Co-located `.spec.ts` files in `apps/backend/` and `packages/utils/`
- Test pure functions directly (e.g., `domain-utils.spec.ts`)
- Test guards/pipes with manual mocks of framework dependencies
- Test services with `@nestjs/testing` `Test.createTestingModule`
- Environment: `node`

**E2E Tests (Integration):**
- Located in `apps/backend-e2e/src/`
- Test full HTTP request/response cycle against running backend
- Organized by domain: `auth/`, `stores/`, `storefront-auth/`
- Require the backend server to be running (global setup waits for port)
- Use real database (shared instance, sequential execution)
- Cookie-based auth testing with `tough-cookie` jar

**E2E Tests (Browser - Playwright):**
- `@nx/playwright/plugin` configured in `nx.json`
- Target name: `e2e`
- No Playwright test files detected currently

## Common Patterns

**Async Testing:**

```typescript
// Resolves pattern
await expect(
  guard.canActivate(createContext(request))
).resolves.toBe(true);

// Rejects pattern
await expect(
  guard.canActivate(createContext(request))
).rejects.toBeInstanceOf(ForbiddenException);

// Async service test
it('sends the internal secret when invalidating router cache', async () => {
  process.env.ROUTER_URL = 'http://storefront-router:3100';
  process.env.ROUTER_INTERNAL_SECRET = 'internal-secret';

  await service.invalidateHostCache('shop.example.com');

  expect(redis.del).toHaveBeenCalledWith('storefront:host:shop.example.com');
  expect(fetchMock).toHaveBeenCalledWith(
    'http://storefront-router:3100/cache/invalidate',
    expect.objectContaining({ method: 'POST' })
  );
});
```

**Error Testing (E2E):**

```typescript
it('should return 401 for wrong password', async () => {
  const client = createAuthClient();
  const { email } = await registerAndGetCredentials(client);

  const loginClient = createAuthClient();
  const res = await loginUser(loginClient, email, 'WrongPassword123');

  expect(res.status).toBe(401);
});
```

**Environment Variable Testing:**

```typescript
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

it('handles missing config', async () => {
  delete process.env.ROUTER_INTERNAL_SECRET;
  await service.invalidateHostCache('shop.example.com');
  expect(loggerWarnSpy).toHaveBeenCalledWith(
    'Router cache invalidation skipped: missing ROUTER_INTERNAL_SECRET'
  );
});
```

**Pure Function Testing:**

```typescript
describe('domain-utils', () => {
  it('builds apex records from ingress IPs', () => {
    expect(
      buildExactHostDnsInstructions('helixstore.com', 'helixstore.com', {
        canonicalTargetHost: 'edge.example.net',
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: ['2001:db8::10'],
      })
    ).toEqual([
      { type: 'A', name: '@', value: '203.0.113.10' },
      { type: 'AAAA', name: '@', value: '2001:db8::10' },
    ]);
  });
});
```

## Test Coverage Gaps

**No frontend tests:** The portal app (`apps/portal/`) has no test files. UI components, hooks, and page components are untested.

**No UI package tests:** `packages/ui/` has no test files for its components (Dropzone, DataTable, DecisionTree, etc.)

**No schema package tests:** `packages/schemas/` has no test files. Zod schema validation logic is only tested implicitly through E2E tests.

**Limited backend unit tests:** Only 5 spec files in `apps/backend/`:
- `apps/backend/src/app/app.service.spec.ts`
- `apps/backend/src/app/admin/auth/guards/jwt-auth.guard.spec.ts`
- `apps/backend/src/app/admin/stores/host-routing.service.spec.ts`
- `apps/backend/src/app/admin/stores/domain-utils.spec.ts`
- `apps/backend/src/app/storefront/auth/guards/store-scope.guard.spec.ts`

**No tests for:** controllers, most services, pipes (FileValidationPipe), interceptors, decorators, or the export system.

---

*Testing analysis: 2026-03-09*
