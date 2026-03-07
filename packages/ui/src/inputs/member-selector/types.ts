export interface MemberItem {
  id: string;
  label: string;
  email?: string;
}

export type MemberFetchOptions = (params: {
  q?: string;
  page?: number;
}) => Promise<{
  data: MemberItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}>;
