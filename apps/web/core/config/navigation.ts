import { ADMIN_NAV_ROUTES } from '@org/constants/routes-constants';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookOpen,
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
    group: 'main',
    description: 'Genel mağaza durumu ve istatistikler',
  },

  {
    key: 'orders',
    icon: ShoppingCart,
    href: ADMIN_NAV_ROUTES.ORDERS,
    visibility: 'both',
    group: 'commerce',
    description: 'Mağaza siparişlerini görüntüle ve yönet',
  },
  {
    key: 'products',
    icon: Package,
    href: ADMIN_NAV_ROUTES.PRODUCTS,
    visibility: 'both',
    group: 'commerce',
    description: 'Ürün kataloğunu ve stokları yönet',
    isSection: false,
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
    group: 'commerce',
    description: 'Müşteri hesapları ve detayları',
    isSection: false,
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
    key: 'inventory',
    icon: Warehouse,
    href: ADMIN_NAV_ROUTES.INVENTORY,
    visibility: 'both',
    group: 'commerce',
    description: 'Depo ve envanter yönetimi',
  },

  {
    key: 'marketing',
    icon: Megaphone,
    href: ADMIN_NAV_ROUTES.MARKETING,
    visibility: 'both',
    group: 'marketing',
    description: 'Pazarlama kampanyalarını yönet',
  },
  {
    key: 'discounts',
    icon: Percent,
    href: ADMIN_NAV_ROUTES.DISCOUNTS,
    visibility: 'both',
    group: 'marketing',
    description: 'İndirim kodları ve promosyonlar',
  },

  {
    key: 'definitions',
    icon: BookOpen,
    href: ADMIN_NAV_ROUTES.DEFINITIONS,
    visibility: 'both',
    group: 'system',
    description: 'Sistem tanımlamaları',
    isSection: true,
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
    group: 'system',
    description: 'Detaylı analizler ve metrikler',
  },
  {
    key: 'reports',
    icon: FileText,
    href: ADMIN_NAV_ROUTES.REPORTS,
    visibility: 'spotlight',
    group: 'system',
    description: 'Oluşturulan raporlar',
  },
  {
    key: 'settings',
    icon: Settings,
    href: ADMIN_NAV_ROUTES.SETTINGS,
    visibility: 'both',
    group: 'system',
    description: 'Sistem ve mağaza ayarları',
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

export function getGroupedNavbarItems(): Map<string, NavItem[]> {
  const grouped = new Map<string, NavItem[]>();
  for (const item of getNavbarItems()) {
    const groupKey = item.group ?? 'ungrouped';
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(item);
  }
  return grouped;
}
