export const ORG_SEED_BASE = 20260309;

export const ORG_ID_PREFIX = 'seed_org';
export const ORG_MEMBER_ID_PREFIX = 'seed_orgmember';
export const ORG_CLOSURE_ID_PREFIX = 'seed_orgclosure';

/** Top-level organization templates */
export const ORG_TREE_TEMPLATES = [
  {
    name: 'Helix Technologies',
    taxId: '1234567890',
    email: 'info@helix-tech.test',
    phone: '+905551000001',
    address: 'Maslak, Sarıyer, İstanbul',
    children: [
      {
        name: 'Helix Cloud Services',
        taxId: '1234567891',
        email: 'cloud@helix-tech.test',
        phone: '+905551000002',
        address: 'Levent, Beşiktaş, İstanbul',
        children: [
          {
            name: 'Helix Cloud - EMEA',
            taxId: '1234567892',
            email: 'emea@helix-tech.test',
            phone: '+905551000003',
            address: 'Berlin, Germany',
            children: [],
          },
          {
            name: 'Helix Cloud - APAC',
            taxId: '1234567893',
            email: 'apac@helix-tech.test',
            phone: '+905551000004',
            address: 'Singapore',
            children: [],
          },
        ],
      },
      {
        name: 'Helix AI Labs',
        taxId: '1234567894',
        email: 'ai@helix-tech.test',
        phone: '+905551000005',
        address: 'Kadıköy, İstanbul',
        children: [],
      },
    ],
  },
  {
    name: 'Anatolian Commerce Group',
    taxId: '9876543210',
    email: 'info@anatolian.test',
    phone: '+905552000001',
    address: 'Çankaya, Ankara',
    children: [
      {
        name: 'Anatolian Retail',
        taxId: '9876543211',
        email: 'retail@anatolian.test',
        phone: '+905552000002',
        address: 'Kızılay, Ankara',
        children: [
          {
            name: 'Anatolian Retail - West',
            taxId: '9876543212',
            email: 'west@anatolian.test',
            phone: '+905552000003',
            address: 'İzmir',
            children: [],
          },
        ],
      },
      {
        name: 'Anatolian Logistics',
        taxId: '9876543213',
        email: 'logistics@anatolian.test',
        phone: '+905552000004',
        address: 'Mersin',
        children: [],
      },
    ],
  },
  {
    name: 'Nova Digital Agency',
    taxId: '5555555550',
    email: 'hello@nova-digital.test',
    phone: '+905553000001',
    address: 'Beşiktaş, İstanbul',
    children: [
      {
        name: 'Nova Design Studio',
        taxId: '5555555551',
        email: 'design@nova-digital.test',
        phone: '+905553000002',
        address: 'Beyoğlu, İstanbul',
        children: [],
      },
    ],
  },
  {
    name: 'EcoTrade International',
    taxId: '7777777770',
    email: 'contact@ecotrade.test',
    phone: '+905554000001',
    address: 'Bornova, İzmir',
    children: [],
  },
  {
    name: 'Stellar Manufacturing',
    taxId: '8888888880',
    email: 'info@stellar-mfg.test',
    phone: '+905555000001',
    address: 'Nilüfer, Bursa',
    children: [
      {
        name: 'Stellar Electronics',
        taxId: '8888888881',
        email: 'electronics@stellar-mfg.test',
        phone: '+905555000002',
        address: 'Osmangazi, Bursa',
        children: [],
      },
      {
        name: 'Stellar Automotive',
        taxId: '8888888882',
        email: 'auto@stellar-mfg.test',
        phone: '+905555000003',
        address: 'Gebze, Kocaeli',
        children: [
          {
            name: 'Stellar Auto Parts',
            taxId: '8888888883',
            email: 'parts@stellar-mfg.test',
            phone: '+905555000004',
            address: 'Çayırova, Kocaeli',
            children: [],
          },
        ],
      },
    ],
  },
] as const;

export type OrgTemplate = {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  children: readonly OrgTemplate[];
};
