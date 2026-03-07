# Domain Management V2

## Purpose

This document is the source of truth for Helix storefront domain onboarding.

Use it when working on:

- `PlatformInstallation`
- `InstallationIngress`
- `DomainSpace`
- `StoreHostBinding`
- TLS ask authorization
- `/.well-known/helix-routing`
- admin domain onboarding flows
- public host resolution

This system is designed for customer-installed Helix deployments, not shared SaaS multi-tenancy.

Example:

- admin portal: `portal.helix.com`
- main storefront: `helixstore.com`
- b2b storefront: `b2b.helixstore.com`

## Core rules

1. `portalHostname` is reserved for admin and can never be used as a storefront host.
2. Storefront routing is host-based. The app resolves `hostname -> StoreHostBinding -> Store`.
3. Proxy config is static. New domains or hosts must not require redeploy or Caddy reload.
4. Ownership verification and routing verification are different concerns and must stay separate.
5. `TXT + HTTP` is the default verification flow.
6. `DIRECT_DNS` exists only as a fallback for special cases.
7. Do not persist generated DNS instruction payloads like V1 did with `verificationData` and `dnsInstructions`.
8. Domain onboarding must work for proxied and non-proxied domains, including Cloudflare orange-cloud.

## Why V2 exists

V1 relied on public `A/AAAA/CNAME` exact-match verification.

That fails for proxied DNS providers because public DNS answers may not match the origin target directly.

Example:

- expected origin IP: `203.0.113.10`
- proxied public answer: Cloudflare edge IP

Result: false negative.

V2 solves this by splitting verification into:

- ownership verification: `TXT`
- routing verification: `HTTP well-known`

This works for both:

- proxied domains
- non-proxied domains

## Data model

### PlatformInstallation

Represents one deployed Helix installation.

Important fields:

- `name`
- `portalHostname`
- `tlsAskSecret`
- `status`

Relations:

- one optional `InstallationIngress`
- many `DomainSpace`

### InstallationIngress

Represents the ingress targets for the installation.

Important fields:

- `canonicalTargetHost`
- `ipv4Addresses`
- `ipv6Addresses`

These fields are used to generate DNS instructions dynamically.

Rules:

- apex instructions come from `ipv4Addresses` and `ipv6Addresses`
- subdomain instructions prefer `CNAME -> canonicalTargetHost`
- if no canonical host exists, subdomains can fall back to `A/AAAA`

### DomainSpace

Represents one domain family.

Examples:

- `helixstore.com`
- `brand-store.com`

Important fields:

- `baseDomain`
- `onboardingMode`
- `status`
- `ownershipMethod`
- `ownershipStatus`
- `ownershipRecordName`
- `ownershipRecordValue`
- `ownershipVerifiedAt`
- `ownershipLastError`
- `apexRoutingMethod`
- `apexRoutingStatus`
- `apexChallengeToken`
- `apexVerifiedAt`
- `apexRoutingLastError`
- `wildcardRoutingMethod`
- `wildcardRoutingStatus`
- `wildcardProbeHost`
- `wildcardChallengeToken`
- `wildcardVerifiedAt`
- `wildcardRoutingLastError`

Status meaning:

- `PENDING_OWNERSHIP`: domain family created, ownership not verified yet
- `READY`: ownership verified, bindings may be created
- `FAILED`: last verification attempt failed
- `ARCHIVED`: retired

Important semantic:

`DomainSpace.status = READY` means ownership is verified.
It does **not** mean apex routing or wildcard routing are both verified.

### StoreHostBinding

Represents one exact host mapped to one store.

Examples:

- `helixstore.com -> B2C store`
- `b2b.helixstore.com -> B2B store`

Important fields:

- `hostname`
- `type`
- `status`
- `routingMethod`
- `routingStatus`
- `challengeToken`
- `activatedAt`
- `routingVerifiedAt`
- `routingLastError`

Status meaning:

- `PENDING_ROUTING`: binding exists but is not live yet
- `ACTIVE`: host is live and resolves to a store
- `FAILED`: last routing verification failed
- `DISABLED`: intentionally disabled

## Enums

### DomainOnboardingMode

- `EXACT_HOSTS`
- `WILDCARD_DELEGATION`
- `HYBRID`

Meaning:

- `EXACT_HOSTS`: every new subdomain needs its own verification
- `WILDCARD_DELEGATION`: wildcard routing can activate future subdomains
- `HYBRID`: apex + optional wildcard model

### DomainOwnershipMethod

- `TXT_TOKEN`
- `DIRECT_DNS`

Default: `TXT_TOKEN`

### DomainRoutingMethod

- `HTTP_WELL_KNOWN`
- `DIRECT_DNS`

Default: `HTTP_WELL_KNOWN`

### VerificationStatus

- `PENDING`
- `VERIFIED`
- `FAILED`
- `SKIPPED`

## Verification model

### Ownership verification

Default method: `TXT_TOKEN`

Expected record:

- record name: `_helix-verify`
- lookup host: `_helix-verify.<baseDomain>`
- record value: generated token stored in `ownershipRecordValue`

Success means:

- customer controls the domain DNS
- `ownershipStatus = VERIFIED`
- `status = READY`

Fallback:

- `DIRECT_DNS`
- used only if explicitly selected
- verifies apex DNS targets against installation ingress

### Apex routing verification

Default method: `HTTP_WELL_KNOWN`

Expected request:

- `GET https://<baseDomain>/.well-known/helix-routing`

Expected response body:

- exact `apexChallengeToken`

Fallback:

- `DIRECT_DNS`
- compares apex DNS instructions against ingress

### Wildcard routing verification

Used when `onboardingMode` is not `EXACT_HOSTS`.

Default method: `HTTP_WELL_KNOWN`

Probe host:

- `__helix-wildcard-check.<baseDomain>`

Expected request:

- `GET https://__helix-wildcard-check.<baseDomain>/.well-known/helix-routing`

Expected response body:

- exact `wildcardChallengeToken`

Fallback:

- `DIRECT_DNS`
- verifies wildcard DNS instruction set

### Exact host routing verification

Used for exact hosts that are not auto-activated by domain-level routing.

Default method: `HTTP_WELL_KNOWN`

Expected request:

- `GET https://<binding.hostname>/.well-known/helix-routing`

Expected response body:

- exact `challengeToken`

Fallback:

- `DIRECT_DNS`
- compares exact host DNS instructions against ingress

## Activation rules

### DomainSpace level

Ownership verification unlocks the domain space for binding creation.

Rules:

- if ownership verified: `status = READY`
- if ownership fails: `status = FAILED`

### Binding level

`StoreHostBinding` activation depends on host type and domain readiness.

Rules:

- apex binding auto-activates if `apexRoutingStatus = VERIFIED`
- non-apex binding auto-activates if:
  - `onboardingMode != EXACT_HOSTS`
  - `wildcardRoutingStatus = VERIFIED`
- otherwise binding starts as `PENDING_ROUTING`

Activation sources:

- `DOMAIN_APEX`
- `DOMAIN_WILDCARD`
- `EXACT_HOST`

## Public runtime behavior

### TLS ask endpoint

Route:

- `GET /api/storefront/domains/ask?domain=<hostname>&token=<tlsAskSecret>`

Responsibility:

- authorize hostnames for TLS issuance

Must allow:

- active storefront bindings
- pending apex challenge host
- pending wildcard probe host
- pending exact binding challenge host

Must reject:

- `portalHostname`
- unknown hosts
- hosts not tied to a valid pending verification flow

### Host resolve endpoint

Route:

- `GET /api/storefront/domains/resolve?hostname=<hostname>`

Responsibility:

- return only active storefront bindings

Must reject:

- `portalHostname`
- unknown hosts
- pending hosts
- failed hosts

### Public challenge endpoint

Route:

- `GET /.well-known/helix-routing`

Implementation details:

- served by backend
- not behind `/api`
- content type: `text/plain`
- cache policy: `no-store`
- body is the challenge token for the current request hostname

Resolution order:

1. exact `StoreHostBinding.challengeToken`
2. `DomainSpace.apexChallengeToken` if host is `baseDomain`
3. `DomainSpace.wildcardChallengeToken` if host is `wildcardProbeHost`

## Admin API

### Installation

- `GET /api/admin/platform-installation`
- `PUT /api/admin/platform-installation`

### Domain space

- `GET /api/admin/domain-spaces`
- `POST /api/admin/domain-spaces`
- `POST /api/admin/domain-spaces/:domainSpaceId/verify-ownership`
- `POST /api/admin/domain-spaces/:domainSpaceId/verify-apex-routing`
- `POST /api/admin/domain-spaces/:domainSpaceId/verify-wildcard-routing`

### Host binding

- `GET /api/admin/store-host-bindings`
- `POST /api/admin/store-host-bindings`
- `POST /api/admin/store-host-bindings/:bindingId/verify-routing`

## Generated response model

Do not return raw Prisma rows directly for domain onboarding UI.

Use computed view models:

- `DomainSpaceView`
- `StoreHostBindingView`

These must include generated:

- ownership TXT record
- apex DNS instructions
- wildcard DNS instructions
- exact host DNS instructions
- HTTP verification URLs
- capability flags

Why:

- derived instructions should always reflect current ingress
- persisted JSON snapshots get stale

## Scenario reference

### 1. Installation only

State:

- `PlatformInstallation` exists
- no `DomainSpace`
- no `StoreHostBinding`

Behavior:

- portal works
- storefront hosts are rejected

### 2. Apex B2C

Flow:

1. create `DomainSpace(helixstore.com)`
2. verify ownership
3. verify apex routing
4. create apex `StoreHostBinding`
5. binding is active

### 3. Apex B2C + exact B2B

Flow:

1. domain space ownership verified
2. apex routing verified
3. apex binding active
4. create `b2b.helixstore.com`
5. exact binding starts `PENDING_ROUTING`
6. verify exact routing
7. binding active

### 4. Wildcard family

Flow:

1. create domain space in `HYBRID` or `WILDCARD_DELEGATION`
2. verify ownership
3. verify wildcard routing via probe host
4. create future subdomain bindings
5. those bindings auto-activate

### 5. Cloudflare proxied domain

Flow:

1. ownership verified through TXT
2. routing verified through HTTP challenge
3. exact public A/CNAME matching is not required

This is the main reason V2 exists.

## Invariants

Do not break these:

- `portalHostname` must never resolve as storefront
- `READY` domain space does not imply routing verified
- `ACTIVE` binding is the only resolvable storefront host
- challenge endpoints may serve pending hosts, resolve endpoint may not
- DNS instructions must be recomputed from `InstallationIngress`
- wildcard DNS alone never creates a store, only a binding does

## Things to avoid

Do not reintroduce:

- persisted `verificationData`
- persisted `dnsInstructions`
- single combined `verify` endpoint
- DNS-only verification as the main path
- logic that assumes Cloudflare-proxied domains will expose origin DNS answers

## Files that matter

Primary backend files:

- `apps/backend/src/app/admin/stores/domain-spaces.service.ts`
- `apps/backend/src/app/admin/stores/store-host-bindings.service.ts`
- `apps/backend/src/app/admin/stores/host-routing.service.ts`
- `apps/backend/src/app/admin/stores/storefront-challenge.controller.ts`
- `apps/backend/src/app/admin/stores/domain-utils.ts`
- `apps/backend/src/app/admin/stores/domain-views.ts`

Shared contract files:

- `packages/prisma/prisma/schema/domain.prisma`
- `packages/prisma/prisma/schema/enums.prisma`
- `packages/schemas/src/admin/settings/store-settings-zod-schema.ts`

Frontend compatibility layer:

- `apps/web/core/hooks/useAdminSettings.ts`
- `apps/web/app/(admin)/admin/settings/page.tsx`

## Migration and regeneration

After schema changes:

```bash
cd /Users/kaanakin/Desktop/helix/packages/prisma
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

If shared types change:

```bash
cd /Users/kaanakin/Desktop/helix
./node_modules/.bin/tsc -p packages/prisma/tsconfig.lib.json
./node_modules/.bin/tsc -p packages/schemas/tsconfig.lib.json
```

## Validation checklist for future changes

Before closing any domain-management change, verify:

- backend typecheck passes
- web typecheck passes
- backend-e2e typecheck passes
- `domain-utils.spec.ts` passes
- pending challenge hosts are allowed by TLS ask
- pending challenge hosts are not returned by resolve
- active bindings still resolve correctly
- proxied-domain verification still uses `TXT + HTTP`

## Real-world domain examples

These examples show concrete configurations a customer might set up.
Use them to understand what the data model looks like end-to-end.

---

### Example A — Single B2C store, apex domain

Customer: small fashion brand, one store, root domain as storefront.

```
portalHostname : admin.brand.com
baseDomain     : brand.com
onboardingMode : HYBRID

DomainSpace    : brand.com          → READY (ownership + apex verified)
StoreHostBinding: brand.com         → ACTIVE (DOMAIN_APEX)
  └─ store: B2C Storefront
```

DNS records customer must set:

```
_helix-verify.brand.com  TXT   "helix-abc123"       ← ownership
brand.com                A     203.0.113.10          ← apex routing
```

What happens:
- Customer sets TXT record → `verify-ownership` → `status=READY`
- Customer sets A record → `verify-apex-routing` → `apexRoutingStatus=VERIFIED`
- Admin creates binding for `brand.com` → auto-activates (`DOMAIN_APEX`)
- `brand.com` resolves to the B2C store

---

### Example B — Apex B2C + B2B subdomain (Scenario 3)

Customer: mid-size manufacturer, two stores on the same domain.

```
portalHostname : admin.brand.com
baseDomain     : brand.com
onboardingMode : HYBRID

DomainSpace    : brand.com          → READY (ownership + apex verified, wildcard PENDING)
StoreHostBinding: brand.com         → ACTIVE (DOMAIN_APEX)
  └─ store: B2C Storefront
StoreHostBinding: b2b.brand.com     → ACTIVE (EXACT_HOST, after verify-routing)
  └─ store: B2B Portal
```

DNS records customer must set:

```
_helix-verify.brand.com  TXT    "helix-abc123"
brand.com                A      203.0.113.10
b2b.brand.com            CNAME  edge.helix.com
```

What happens:
- Apex verified → `brand.com` binding auto-activates
- `b2b.brand.com` binding created → starts `PENDING_ROUTING`
- Customer deploys `b2b.brand.com` CNAME → system probes `/.well-known/helix-routing` → `ACTIVE`

---

### Example C — Wildcard family (Scenario 4)

Customer: SaaS-like deployment, multiple tenant stores under one domain.

```
portalHostname : admin.brand.com
baseDomain     : brand.com
onboardingMode : WILDCARD_DELEGATION

DomainSpace    : brand.com          → READY (ownership + wildcard verified)
StoreHostBinding: shop.brand.com    → ACTIVE (DOMAIN_WILDCARD)
  └─ store: Main Store
StoreHostBinding: wholesale.brand.com → ACTIVE (DOMAIN_WILDCARD)
  └─ store: Wholesale Store
StoreHostBinding: vip.brand.com     → ACTIVE (DOMAIN_WILDCARD)
  └─ store: VIP Store
```

DNS records customer must set:

```
_helix-verify.brand.com              TXT    "helix-abc123"
*.brand.com                          CNAME  edge.helix.com
__helix-wildcard-check.brand.com     CNAME  edge.helix.com   ← auto-created by wildcard
```

What happens:
- Wildcard CNAME verified via probe host `__helix-wildcard-check.brand.com`
- Any new subdomain binding under `brand.com` auto-activates immediately
- No per-subdomain DNS change needed after the wildcard is set

---

### Example D — Cloudflare orange-cloud (Scenario 5)

Customer: uses Cloudflare proxy (orange cloud enabled). V1 would fail here.

```
portalHostname : admin.brand.com
baseDomain     : brand.com
onboardingMode : HYBRID
```

Without V2: apex A record check would see Cloudflare edge IP, not `203.0.113.10` → false negative.

With V2:
- Ownership: TXT record is not proxied by Cloudflare → resolves correctly
- Routing: HTTP challenge hits the origin through Cloudflare → returns correct token

DNS records customer must set (same as Example A):

```
_helix-verify.brand.com  TXT   "helix-abc123"
brand.com                A     203.0.113.10    ← proxied by Cloudflare, orange cloud ON
```

The public A record will resolve to Cloudflare's edge IP. That does not matter.
V2 only checks the HTTP challenge token, not the IP.

---

### Example E — Multi-brand installation

Customer: agency managing multiple independent brand stores.

```
portalHostname : admin.agency.com

DomainSpace    : brandA.com         → READY
  StoreHostBinding: brandA.com      → ACTIVE
    └─ store: Brand A Store

DomainSpace    : brandB.com         → READY
  StoreHostBinding: brandB.com      → ACTIVE
    └─ store: Brand B Store
  StoreHostBinding: b2b.brandB.com  → ACTIVE
    └─ store: Brand B B2B

DomainSpace    : brandC.com         → PENDING_OWNERSHIP
  (customer has not set TXT record yet)
```

Key point: each `DomainSpace` is independent. One domain's verification state
does not affect another. All route through the same ingress targets.

---

### Example F — EXACT_HOSTS mode (no wildcard auto-activation)

Customer: strict environment, wants every subdomain approved individually.

```
portalHostname : admin.brand.com
baseDomain     : brand.com
onboardingMode : EXACT_HOSTS

DomainSpace    : brand.com          → READY (wildcard PENDING or not set)
StoreHostBinding: shop.brand.com    → PENDING_ROUTING (must verify individually)
StoreHostBinding: b2b.brand.com     → PENDING_ROUTING (must verify individually)
```

Even if wildcard DNS is set, bindings will not auto-activate in `EXACT_HOSTS` mode.
Each binding requires its own `verify-routing` call.

---

### Hostname resolution rules summary

| hostname | condition | result |
|----------|-----------|--------|
| `portalHostname` | always | rejected (403 TLS ask, 404 resolve) |
| `baseDomain` | apex binding ACTIVE | resolves to store |
| `sub.domain.com` | binding ACTIVE | resolves to store |
| `sub.domain.com` | binding PENDING_ROUTING | 404 on resolve, 200 on TLS ask (challenge) |
| `__helix-wildcard-check.domain.com` | wildcard pending | 200 on TLS ask, 404 on resolve |
| unknown hostname | — | 403 TLS ask, 404 resolve |
