import { ADMIN_NAV_ROUTES } from '@org/constants/routes-constants';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  Percent,
  Settings,
  ShoppingCart,
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
  },
  {
    key: 'customers',
    icon: Users,
    href: ADMIN_NAV_ROUTES.CUSTOMERS,
    visibility: 'both',
    group: 'commerce',
    description: 'Müşteri hesapları ve detayları',
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

export function getNavbarItems(): NavItem[] {
  return adminNavItems.filter(
    (item) => item.visibility === 'navbar' || item.visibility === 'both'
  );
}

export function getSpotlightItems(): NavItem[] {
  return adminNavItems.filter(
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
