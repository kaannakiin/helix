export const PRICING_TARGET_STORE_SLUGS = [
  'helix-magaza',
  'helix-toptan',
] as const;

export type PricingStoreSlug = (typeof PRICING_TARGET_STORE_SLUGS)[number];

export const PRICING_REQUIRED_CURRENCIES = [
  'TRY',
  'USD',
  'EUR',
  'GBP',
] as const;

export const PRICING_VARIANT_SAMPLE_LIMIT = 12;
export const PRICING_ARCHIVED_VARIANT_COUNT = 4;

export const PRICING_SYSTEM_BASE_PRICE_LIST_IDS = {
  'helix-magaza': 'gwzul31d1bvkhf9jmb4e2hzq',
  'helix-toptan': 'j4u0g1arljpqnc8dmrhejhsi',
} as const satisfies Record<PricingStoreSlug, string>;

export const PRICING_CUSTOMER_GROUP_IDS = {
  'helix-magaza': 'fy4p5beizkre5g1c8uc1u1um',
  'helix-toptan': 'ywlwr9a6iuykdf58wjx4w3nw',
} as const satisfies Record<PricingStoreSlug, string>;

export const PRICING_SCENARIO_IDS = {
  'helix-magaza': [
    'jh7t4bwzfuz9rbj7bnro4ah3', // base_usd
    'fybti5u5fbdv3twpmgcjbgq5', // sale_campaign
    'lx2diwebol1inv1m4ntt8nma', // vip_custom
    'evmtrgou0ta3wpqtt0bohdy3', // customer_offer
    'j6ynjbmaaabeh0ftz93yrlnp', // sale_draft
    'm6pg5u024d0tj1xrzl9pu9if', // custom_archived
  ],
  'helix-toptan': [
    'vsqqykazs8i3hiq4ivbzmr0u', // base_eur
    'e03aubejoyj8f3u3hcf2txtw', // sale_wholesale
    'iru2hfcicdn761msvwfikoem', // reseller_custom
    'een1olhcknm064ykycqxejcj', // org_contract
    'rbgvhdeyy0lqpxhuils44zoa', // contract_draft
    'qzoitbn23hh5g0fv5i32cy6s', // custom_archived
  ],
} as const satisfies Record<PricingStoreSlug, readonly string[]>;

export const PRICING_EXPECTED_SCENARIO_IDS = Object.values(
  PRICING_SCENARIO_IDS,
).flat();
