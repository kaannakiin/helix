import { AdminShell } from '@/core/ui/components/admin-layout/admin-shell';
import { cookies } from 'next/headers';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const storeId = (await cookies()).get('x-store-id')?.value;
  return <AdminShell initialStoreId={storeId}>{children}</AdminShell>;
}
