# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Runner:**
- Jest 30.0.2
- Config: `jest.config.ts` (root) with Nx task discovery
- Per-project config: `jest.config.cts` (CommonJS) in `apps/backend` and `apps/backend-e2e`

**Transpiler:**
- SWC (@swc/jest 0.2.38) for fast TypeScript compilation
- Each project has `.spec.swcrc` JSON file for SWC configuration
- Node test environment (`testEnvironment: 'node'`)

**Assertion Library:**
- Jest built-in matchers (expect API)

**Run Commands:**
```bash
# All projects
npx nx run-many -t test

# Single project
npx nx test @org/backend
npx nx test <project>

# Watch mode (not explicitly configured but Jest supports)
npx nx test @org/backend -- --watch

# Coverage
npx nx test @org/backend              # Coverage generated to test-output/jest/coverage
npx nx test --coverage               # With Nx task runner

# Specific test file pattern
npx nx test @org/backend -- --testPathPattern=auth
```

## Test File Organization

**Location:**
- Backend unit tests: Co-located with source (same directory as implementation)
- Backend E2E tests: `apps/backend-e2e/src/` — separate project with global setup/teardown
- Utils unit tests: `packages/utils/src/lib/utils.spec.ts`

**Naming:**
- `.spec.ts` suffix: `login.spec.ts`, `utils.spec.ts`, `auth.helper.ts` (helpers not tests)

**Structure:**
```
apps/backend-e2e/
├── jest.config.cts
├── .spec.swcrc
└── src/
    ├── support/
    │   ├── global-setup.ts      # Run once before all tests
    │   ├── global-teardown.ts   # Run once after all tests
    │   ├── test-setup.ts        # Run before each test
    │   └── auth.helper.ts       # Shared test utilities (not a test file)
    └── auth/
        ├── login.spec.ts
        ├── register.spec.ts
        ├── refresh.spec.ts
        ├── logout.spec.ts
        ├── sessions.spec.ts
        ├── devices.spec.ts
        ├── profile.spec.ts
        ├── change-password.spec.ts
        └── login-history.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
// apps/backend-e2e/src/auth/login.spec.ts
describe('POST /api/auth/login', () => {
  it('should login with correct email and password', async () => {
    // Test implementation
  });

  it('should return 401 for wrong password', async () => {
    // Test implementation
  });
});
```

Pattern: `describe('{HTTP METHOD} {endpoint}', () => { ... })`

**Patterns:**

1. **Setup phase** — Create test fixture (register user, get credentials)
   ```ts
   const client = createAuthClient();
   const { email, password } = await registerAndGetCredentials(client);
   ```

2. **Action phase** — Call API endpoint
   ```ts
   const loginClient = createAuthClient();
   const res = await loginUser(loginClient, email, password);
   ```

3. **Assertion phase** — Verify status, response body, headers
   ```ts
   expect(res.status).toBe(200);
   expect(res.data.user).toBeDefined();
   expect(res.headers['set-cookie']).toContain('access_token');
   ```

## Mocking

**Framework:** Axios instance wrapping (not Jest mocks)

**Patterns:**
Test clients are isolated instances, not mocks:
```typescript
// Each client has its own cookie jar
export function createAuthClient(): AxiosInstance {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: axios.defaults.baseURL,
      jar,
      withCredentials: true,
      validateStatus: () => true, // Don't throw on non-2xx
    })
  );
  return client;
}
```

Uses `axios-cookiejar-support` + `tough-cookie` for cookie management in tests.

**What to Mock:**
- External services via test helpers (not Jest mocks)
- Database calls via Prisma migrations (test database is real, populated via seed)

**What NOT to Mock:**
- HTTP calls — use real axios instances with test server
- Database — use real test database with migrations
- Authentication flow — test entire JWT/refresh token cycle
- Cookie handling — use real cookie jars to test session management

## Fixtures and Factories

**Test Data:**
```typescript
// apps/backend-e2e/src/support/auth.helper.ts

export const DEFAULT_PASSWORD = 'TestPass123';

export function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `test-${ts}-${rand}@e2e.test`;
}

export async function registerAndGetCredentials(
  client: AxiosInstance,
  overrides: { name?: string; password?: string } = {}
) {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? DEFAULT_PASSWORD;
  const response = await registerUser(client, { email, password });
  return { email, password, response };
}
```

**Location:**
- Test helpers in `apps/backend-e2e/src/support/` — `auth.helper.ts` contains factory functions
- Utilities for: creating HTTP clients, generating unique test data, making API calls
- Each helper function is thoroughly documented with JSDoc

**Patterns:**
- Unique email generation: `test-{timestamp}-{random}@e2e.test` ensures isolation
- Unique phone: Turkish mobile format `+9055{9-digit}`
- Overrides pattern: `registerAndGetCredentials(client, { email: 'custom@test.com' })`

## Coverage

**Requirements:** Not enforced (no coverage threshold detected)

**View Coverage:**
```bash
npx nx test @org/backend
# Coverage written to: apps/backend/test-output/jest/coverage
```

Coverage configuration present but no threshold rules in jest.config.cts files.

## Test Types

**Unit Tests:**
- Location: `packages/utils/src/lib/utils.spec.ts`
- Scope: Individual utilities
- Approach: Jest direct with simple expect assertions
- Example: `utils()` returns `'utils'`

**Integration Tests:**
- Location: Same as unit tests (no separate integration folder)
- Scope: Service methods with Prisma (use real database)
- Approach: Similar to E2E but closer to source

**E2E Tests:**
- Framework: Jest + Axios (not Cypress/Playwright)
- Location: `apps/backend-e2e/` — separate project
- Scope: Full HTTP request → NestJS → Prisma → Database
- Global setup/teardown: `global-setup.ts`, `global-teardown.ts`
- Setup per test: `test-setup.ts` configures axios baseURL
- Patterns: Real API calls, real database, real cookie handling

**E2E Test Structure:**
```typescript
// Global setup: Wait for server to start on port 3001
await waitForPortOpen(3001, { host: 'localhost' });

// Test setup: Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001';

// Test: Make real HTTP request
const res = await loginClient.post('/api/auth/login', { email, password });
expect(res.status).toBe(200);
```

## Common Patterns

**Async Testing:**
```typescript
// Async test with await
it('should login with correct email and password', async () => {
  const res = await loginUser(client, email, password);
  expect(res.status).toBe(200);
});

// No async/await wrapper needed — Jest handles promise returns
```

**Error Testing:**
```typescript
// Check error status code
it('should return 401 for wrong password', async () => {
  const res = await loginUser(client, email, 'WrongPassword123');
  expect(res.status).toBe(401);
});

// No exception thrown; validateStatus: () => true catches all responses
```

**Test Isolation:**
```typescript
// Each test creates fresh client and user
it('test 1', async () => {
  const client = createAuthClient();      // Fresh instance
  const { email, password } = await registerAndGetCredentials(client);
  // ...
});

it('test 2', async () => {
  const client = createAuthClient();      // Different instance, different cookies
  const { email, password } = await registerAndGetCredentials(client);  // Different user
  // ...
});
```

Pattern: Each test registers a unique user, preventing cross-test contamination.

**Helper Pattern:**
```typescript
// Helper returns full response object for test assertions
export async function loginUser(
  client: AxiosInstance,
  email: string,
  password: string = DEFAULT_PASSWORD
) {
  return client.post('/api/auth/login', { email, password });
}

// Helper with full return value
export async function registerAndGetCredentials(
  client: AxiosInstance,
  overrides: { name?: string; password?: string } = {}
) {
  const email = uniqueEmail();
  const password = DEFAULT_PASSWORD;
  const response = await registerUser(client, { email, password });
  return { email, password, response };
}
```

Helpers return the full response (not parsed), allowing tests to assert on status, headers, and body.

## Test Dependencies

**Jest Preset:**
```bash
# Root: jest.config.ts uses Nx preset
preset: '../../jest.preset.js'

# Configured in Jest preset:
- testEnvironment: 'node'
- transform: SWC (@swc/jest)
- moduleFileExtensions: ['ts', 'js', 'html']
```

**Target Dependencies:**
- `test` targets depend on `^build` (dependencies must compile before tests)
- Ensures all Nx packages are built before running tests

**Environment Setup:**
```bash
# E2E test environment variables (from test-setup.ts)
HOST = 'localhost'
PORT = 3001 (backend server)
DATABASE_URL = (Prisma, configured in backend)
```

## Debugging

**Commands:**
```bash
# Debug single test file
npx nx test @org/backend -- --testPathPattern=auth --detectOpenHandles
```

**Options:**
- `--detectOpenHandles` — Show unclosed connections
- `--testPathPattern={pattern}` — Run tests matching file path pattern
- `--verbose` — Show individual test results (not just summary)

---

*Testing analysis: 2026-02-27*
