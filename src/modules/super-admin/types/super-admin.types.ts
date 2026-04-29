export interface Church {
  id: number;
  name: string;
  slug: string;
  presbiterio: string;
  distrito: string;
  address: string | null;
  phone: string | null;
  status: 'active' | 'suspended' | 'inactive';
  members_count: number | null;
  admin_name: string | null;
  admin_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChurchFormValues {
  name: string;
  presbiterio: string;
  distrito: string;
  address: string;
  phone: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface DashboardStats {
  total_churches: number;
  active_churches: number;
  suspended_churches: number;
  inactive_churches: number;
  total_users: number;
  recent_churches: Church[];
}
