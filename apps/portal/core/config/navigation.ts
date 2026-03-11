import { ADMIN_NAV_ROUTES } from '@org/constants/routes-constants';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  DollarSign,
  FileText,
  FolderTree,
  Globe,
  Hash,
  Layers,
  LayoutDashboard,
  Megaphone,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react';

export type NavVisibility = 'navbar' | 'spotlight' | 'both';

export interface NavItem {
  key: string;
  icon: LucideIcon;
  href: string;
  visibility: NavVisibility;
  group?: string;
  description?: string;
  children?: NavItem[];

  isSection?: boolean;
}

export const adminNavItems: NavItem[] = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    href: ADMIN_NAV_ROUTES.DASHBOARD,
    visibility: 'both',
    group: 'overview',
    description: 'Kontrol paneli, özetler ve genel operasyon görünümü',
  },
  {
    key: 'orders',
    icon: ShoppingCart,
    href: ADMIN_NAV_ROUTES.ORDERS,
    visibility: 'both',
    group: 'sales',
    description: 'Sipariş operasyonlarını ve akışlarını takip et',
  },
  {
    key: 'stores',
    icon: Store,
    href: ADMIN_NAV_ROUTES.STORES,
    visibility: 'both',
    group: 'sales',
    description: 'Mağazaları, storefront durumlarını ve kanal yapısını yönet',
  },
  {
    key: 'products',
    icon: Package,
    href: ADMIN_NAV_ROUTES.PRODUCTS,
    visibility: 'both',
    group: 'catalog',
    description: 'Ürün kataloğunu ve bağlı katalog yapılarını yönet',
    children: [
      {
        key: 'brands',
        icon: Tag,
        href: ADMIN_NAV_ROUTES.BRANDS,
        visibility: 'both',
        description: 'Markaları listele ve yönet',
      },
      {
        key: 'categories',
        icon: FolderTree,
        href: ADMIN_NAV_ROUTES.CATEGORIES,
        visibility: 'both',
        description: 'Ürün kategorilerini yönet',
      },
      {
        key: 'tags',
        icon: Hash,
        href: ADMIN_NAV_ROUTES.TAGS,
        visibility: 'both',
        description: 'Etiket gruplarını yönet',
      },
      {
        key: 'variants',
        icon: Layers,
        href: ADMIN_NAV_ROUTES.VARIANTS,
        visibility: 'both',
        description: 'Ürün varyantlarını yönet',
      },
    ],
  },
  {
    key: 'customers',
    icon: Users,
    href: ADMIN_NAV_ROUTES.CUSTOMERS,
    visibility: 'both',
    group: 'customers',
    description: 'Müşteri hesapları, segmentler ve erişim kapsamını yönet',
    children: [
      {
        key: 'customer_groups',
        icon: Users,
        href: ADMIN_NAV_ROUTES.CUSTOMER_GROUPS,
        visibility: 'both',
        description: 'Müşteri gruplarını yönet',
      },
    ],
  },
  {
    key: 'organizations',
    icon: Building2,
    href: ADMIN_NAV_ROUTES.ORGANIZATIONS,
    visibility: 'both',
    group: 'customers',
    description: 'B2B organizasyonlarını ve kurumsal yapılarını yönet',
  },
  {
    key: 'inventory',
    icon: Warehouse,
    href: ADMIN_NAV_ROUTES.INVENTORY,
    visibility: 'both',
    group: 'operations',
    description: 'Depo ve envanter operasyonlarını yönet',
    children: [
      {
        key: 'warehouses',
        icon: Warehouse,
        href: ADMIN_NAV_ROUTES.WAREHOUSES,
        visibility: 'both',
        description: 'Depoları listele ve yönet',
      },
    ],
  },

  {
    key: 'marketing',
    icon: Megaphone,
    href: ADMIN_NAV_ROUTES.MARKETING,
    visibility: 'both',
    group: 'catalog',
    description: 'Pazarlama kurgularını ve ticari görünürlüğü yönet',
  },
  {
    key: 'discounts',
    icon: Percent,
    href: ADMIN_NAV_ROUTES.DISCOUNTS,
    visibility: 'both',
    group: 'catalog',
    description: 'İndirim kodları ve promosyonlar',
  },
  {
    key: 'definitions',
    icon: BookOpen,
    href: ADMIN_NAV_ROUTES.DEFINITIONS,
    visibility: 'both',
    group: 'admin',
    description: 'Sistem tanımlamaları',
    children: [
      {
        key: 'locations',
        icon: Globe,
        href: ADMIN_NAV_ROUTES.LOCATIONS,
        visibility: 'both',
        description: 'Ülke, şehir ve bölge yönetimi',
      },
      {
        key: 'price_lists',
        icon: DollarSign,
        href: ADMIN_NAV_ROUTES.PRICE_LISTS,
        visibility: 'both',
        description: 'Fiyat listelerini yönet',
      },
      {
        key: 'evaluation_jobs',
        icon: Activity,
        href: ADMIN_NAV_ROUTES.EVALUATION_JOBS,
        visibility: 'both',
        description: 'İş akışları ve değerlendirme süreçleri',
      },
    ],
  },

  {
    key: 'analytics',
    icon: BarChart3,
    href: ADMIN_NAV_ROUTES.ANALYTICS,
    visibility: 'both',
    group: 'insights',
    description: 'Detaylı analizler ve metrikler',
  },
  {
    key: 'reports',
    icon: FileText,
    href: ADMIN_NAV_ROUTES.REPORTS,
    visibility: 'spotlight',
    group: 'insights',
    description: 'Oluşturulan raporlar',
  },
  {
    key: 'settings',
    icon: Settings,
    href: ADMIN_NAV_ROUTES.SETTINGS,
    visibility: 'both',
    group: 'admin',
    description: 'Sistem ayarları',
    children: [
      {
        key: 'platform',
        icon: Globe,
        href: ADMIN_NAV_ROUTES.PLATFORM,
        visibility: 'both',
        description: 'Portal, dil ve sunucu ayarları',
      },
    ],
  },
];

export function getAllItems(items: NavItem[] = adminNavItems): NavItem[] {
  return items.flatMap((item) => [item, ...getAllItems(item.children ?? [])]);
}

export function getNavbarItems(): NavItem[] {
  return adminNavItems.filter(
    (item) => item.visibility === 'navbar' || item.visibility === 'both'
  );
}

export function getSpotlightItems(): NavItem[] {
  return getAllItems().filter(
    (item) => item.visibility === 'spotlight' || item.visibility === 'both'
  );
}

const NAVBAR_GROUP_ORDER = [
  'overview',
  'sales',
  'catalog',
  'customers',
  'operations',
  'admin',
  'insights',
  'ungrouped',
] as const;

export function getGroupedNavbarItems(): Map<string, NavItem[]> {
  const grouped = new Map<string, NavItem[]>(
    NAVBAR_GROUP_ORDER.map((groupKey) => [groupKey, [] as NavItem[]])
  );

  for (const item of getNavbarItems()) {
    const groupKey = item.group ?? 'ungrouped';
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(item);
  }

  for (const [groupKey, items] of grouped.entries()) {
    if (items.length === 0) {
      grouped.delete(groupKey);
    }
  }

  return grouped;
}
