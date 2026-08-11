export interface Product {
  id: string;
  name: string;
  product_code: string;
  version: string;
  active: number;
  created_at: string;
}

export interface License {
  id: string;
  client_id: string;
  product_id: string;
  mt5_account_id: string;
  broker: string;
  server: string;
  start_date: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED' | 'SUSPENDED';
  daysRemaining?: number;
  last_verification?: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  deleted_at?: string | null;
  licenses: License[];
}

export interface VerificationLog {
  id: string;
  license_id?: string | null;
  mt5_account_id: string;
  product_code: string;
  result: 'VALID' | 'INVALID';
  reason: string;
  ip_address: string;
  created_at: string;
}

export interface DashboardStats {
  totalClients: number;
  activeLicenses: number;
  expiringSoon: number;
  expiredLicenses: number;
  blockedLicenses: number;
  totalLogs: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
}
