import fs from 'fs';
import path from 'path';
import pg from 'pg';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  deleted_at?: string | null;
}

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
  start_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED' | 'SUSPENDED';
  last_verification?: string | null;
  created_at: string;
  updated_at: string;
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

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  email: string;
  created_at: string;
}

export interface DatabaseData {
  admin_users: AdminUser[];
  clients: Client[];
  products: Product[];
  licenses: License[];
  verification_logs: VerificationLog[];
}

const DATA_DIR = path.join(process.cwd(), 'database');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// PostgreSQL pool initialization if DATABASE_URL is present
let pgPool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
}

function initialData(): DatabaseData {
  const now = new Date().toISOString();
  // Default hashed password for 'admin123' (bcrypt salt 10 hash)
  // $2a$10$wT1B/aD0.uT4yQJv1M6w1.740A/XyL6UjL60f4P.Jp3jM3iI2/8C2 -> admin123
  const defaultAdminPasswordHash = '$2a$10$iI8cT1s8rOmsF9Amev46eeVzZ6XzP5H61w4Z/uH4Yn2ZqA3YnZ3fG';

  const nowObj = new Date();
  const threeMonthsLater = new Date(nowObj.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(nowObj.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sixMonthsLater = new Date(nowObj.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = nowObj.toISOString().split('T')[0];

  return {
    admin_users: [
      {
        id: 'usr_admin_1',
        username: 'admin',
        password_hash: defaultAdminPasswordHash,
        email: 'admin@ea-license.com',
        created_at: now
      }
    ],
    clients: [
      {
        id: 'cli_1',
        name: 'Ahmad Sudirman',
        email: 'ahmad@example.com',
        phone: '+6281234567890',
        notes: 'VIP Client - Account Active',
        created_at: now
      },
      {
        id: 'cli_2',
        name: 'Budi Santoso',
        email: 'budi@example.com',
        phone: '+6289876543210',
        notes: 'License Expired',
        created_at: now
      },
      {
        id: 'cli_3',
        name: 'Dewi Lestari',
        email: 'dewi@example.com',
        phone: '+6281122334455',
        notes: 'Account Blocked for violation',
        created_at: now
      }
    ],
    products: [
      {
        id: 'prod_1',
        name: 'MetaTrader 5 Straddle Bot',
        product_code: 'EA_STRADDLE',
        version: '1.0.0',
        active: 1,
        created_at: now
      },
      {
        id: 'prod_2',
        name: 'MT5 Trend Follower Pro',
        product_code: 'EA_TREND_PRO',
        version: '2.1.0',
        active: 1,
        created_at: now
      }
    ],
    licenses: [
      {
        id: 'lic_1',
        client_id: 'cli_1',
        product_id: 'prod_1',
        mt5_account_id: '12345678',
        broker: 'IC Markets',
        server: 'ICMarketsSC-Live',
        start_date: todayStr,
        expiry_date: threeMonthsLater,
        status: 'ACTIVE',
        last_verification: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 'lic_2',
        client_id: 'cli_2',
        product_id: 'prod_1',
        mt5_account_id: '87654321',
        broker: 'Exness',
        server: 'Exness-Real10',
        start_date: '2025-01-01',
        expiry_date: thirtyDaysAgo,
        status: 'EXPIRED',
        last_verification: '2025-02-01T10:00:00Z',
        created_at: now,
        updated_at: now
      },
      {
        id: 'lic_3',
        client_id: 'cli_3',
        product_id: 'prod_1',
        mt5_account_id: '55554444',
        broker: 'FBS',
        server: 'FBS-Real',
        start_date: todayStr,
        expiry_date: sixMonthsLater,
        status: 'BLOCKED',
        last_verification: '2026-03-01T08:00:00Z',
        created_at: now,
        updated_at: now
      }
    ],
    verification_logs: [
      {
        id: 'log_1',
        license_id: 'lic_1',
        mt5_account_id: '12345678',
        product_code: 'EA_STRADDLE',
        result: 'VALID',
        reason: 'VERIFICATION_SUCCESSFUL',
        ip_address: '127.0.0.1',
        created_at: now
      }
    ]
  };
}

class DatabaseService {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          admin_users: parsed.admin_users || [],
          clients: parsed.clients || [],
          products: parsed.products || [],
          licenses: parsed.licenses || [],
          verification_logs: parsed.verification_logs || []
        };
      }
    } catch (error) {
      console.error('Error loading database file, initializing defaults:', error);
    }
    const defaults = initialData();
    this.saveData(defaults);
    return defaults;
  }

  private saveData(dataToSave?: DatabaseData) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }

  // Get raw JSON store
  public getData(): DatabaseData {
    return this.data;
  }

  // Reload or reset
  public reload() {
    this.data = this.loadData();
  }

  // Database operations
  public getAdminByUsername(username: string): AdminUser | undefined {
    return this.data.admin_users.find((u) => u.username === username);
  }

  public getAdminById(id: string): AdminUser | undefined {
    return this.data.admin_users.find((u) => u.id === id);
  }

  public updateAdminPassword(id: string, newHash: string) {
    const admin = this.data.admin_users.find((u) => u.id === id);
    if (admin) {
      admin.password_hash = newHash;
      this.saveData();
    }
  }

  public getClients(): (Client & { licenses: (License & { product?: Product })[] })[] {
    const activeClients = this.data.clients.filter((c) => !c.deleted_at);
    return activeClients.map((client) => {
      const licenses = this.data.licenses
        .filter((l) => l.client_id === client.id)
        .map((license) => {
          const product = this.data.products.find((p) => p.id === license.product_id);
          return { ...license, product };
        });
      return { ...client, licenses };
    });
  }

  public getClientById(id: string): (Client & { licenses: (License & { product?: Product })[] }) | undefined {
    const client = this.data.clients.find((c) => c.id === id && !c.deleted_at);
    if (!client) return undefined;
    const licenses = this.data.licenses
      .filter((l) => l.client_id === client.id)
      .map((license) => {
        const product = this.data.products.find((p) => p.id === license.product_id);
        return { ...license, product };
      });
    return { ...client, licenses };
  }

  public createClientWithLicense(params: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    mt5AccountId: string;
    broker: string;
    server: string;
    productId: string;
    durationMonths: number;
  }): { client: Client; license: License } {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = nowIso.split('T')[0];

    // Calculate expiry date
    const expiryDateObj = new Date(now);
    expiryDateObj.setMonth(expiryDateObj.getMonth() + params.durationMonths);
    const expiryStr = expiryDateObj.toISOString().split('T')[0];

    const clientId = `cli_${Date.now()}`;
    const client: Client = {
      id: clientId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      notes: params.notes,
      created_at: nowIso
    };

    const licenseId = `lic_${Date.now()}`;
    const license: License = {
      id: licenseId,
      client_id: clientId,
      product_id: params.productId,
      mt5_account_id: params.mt5AccountId,
      broker: params.broker,
      server: params.server,
      start_date: todayStr,
      expiry_date: expiryStr,
      status: 'ACTIVE',
      last_verification: null,
      created_at: nowIso,
      updated_at: nowIso
    };

    this.data.clients.push(client);
    this.data.licenses.push(license);
    this.saveData();

    return { client, license };
  }

  public updateClient(id: string, updates: Partial<Client>): Client | undefined {
    const index = this.data.clients.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    this.data.clients[index] = { ...this.data.clients[index], ...updates };
    this.saveData();
    return this.data.clients[index];
  }

  public softDeleteClient(id: string): boolean {
    const client = this.data.clients.find((c) => c.id === id);
    if (!client) return false;
    client.deleted_at = new Date().toISOString();
    this.saveData();
    return true;
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductByCode(code: string): Product | undefined {
    return this.data.products.find((p) => p.product_code === code && p.active === 1);
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public createProduct(params: { name: string; product_code: string; version: string }): Product {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: params.name,
      product_code: params.product_code.toUpperCase(),
      version: params.version || '1.0.0',
      active: 1,
      created_at: new Date().toISOString()
    };
    this.data.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  public getLicenseByAccountAndProduct(mt5AccountId: string, productCode: string): (License & { client?: Client; product?: Product }) | undefined {
    const product = this.getProductByCode(productCode);
    if (!product) return undefined;

    const license = this.data.licenses.find((l) => l.mt5_account_id === mt5AccountId && l.product_id === product.id);
    if (!license) return undefined;

    const client = this.data.clients.find((c) => c.id === license.client_id && !c.deleted_at);
    return { ...license, client, product };
  }

  public getLicenseById(id: string): License | undefined {
    return this.data.licenses.find((l) => l.id === id);
  }

  public extendLicense(id: string, months: number): License | undefined {
    const license = this.data.licenses.find((l) => l.id === id);
    if (!license) return undefined;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let baseDateObj: Date;

    // Check if license is still active and expiry is in the future
    if (license.expiry_date >= todayStr && license.status !== 'BLOCKED') {
      baseDateObj = new Date(license.expiry_date);
    } else {
      // If expired or blocked, extend starting from today
      baseDateObj = new Date();
    }

    baseDateObj.setMonth(baseDateObj.getMonth() + months);
    const newExpiryStr = baseDateObj.toISOString().split('T')[0];

    license.expiry_date = newExpiryStr;
    license.status = 'ACTIVE';
    license.updated_at = new Date().toISOString();

    this.saveData();
    return license;
  }

  public setLicenseStatus(id: string, status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED' | 'SUSPENDED'): License | undefined {
    const license = this.data.licenses.find((l) => l.id === id);
    if (!license) return undefined;

    license.status = status;
    license.updated_at = new Date().toISOString();
    this.saveData();
    return license;
  }

  public changeLicenseAccount(id: string, newMt5AccountId: string): License | undefined {
    const license = this.data.licenses.find((l) => l.id === id);
    if (!license) return undefined;

    license.mt5_account_id = newMt5AccountId;
    license.updated_at = new Date().toISOString();
    this.saveData();
    return license;
  }

  public updateLastVerification(licenseId: string) {
    const license = this.data.licenses.find((l) => l.id === licenseId);
    if (license) {
      license.last_verification = new Date().toISOString();
      this.saveData();
    }
  }

  public logVerification(params: {
    license_id?: string | null;
    mt5_account_id: string;
    product_code: string;
    result: 'VALID' | 'INVALID';
    reason: string;
    ip_address: string;
  }): VerificationLog {
    const log: VerificationLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      license_id: params.license_id || null,
      mt5_account_id: params.mt5_account_id,
      product_code: params.product_code,
      result: params.result,
      reason: params.reason,
      ip_address: params.ip_address || '127.0.0.1',
      created_at: new Date().toISOString()
    };

    this.data.verification_logs.unshift(log); // newest first
    // Limit logs in memory file to 1000 entries
    if (this.data.verification_logs.length > 1000) {
      this.data.verification_logs = this.data.verification_logs.slice(0, 1000);
    }
    this.saveData();
    return log;
  }

  public getVerificationLogs(limit = 100): VerificationLog[] {
    return this.data.verification_logs.slice(0, limit);
  }

  public getDashboardStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const activeClientsCount = this.data.clients.filter((c) => !c.deleted_at).length;
    let activeLicensesCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let blockedCount = 0;

    for (const l of this.data.licenses) {
      if (l.status === 'BLOCKED') {
        blockedCount++;
      } else if (l.status === 'ACTIVE' || l.expiry_date >= todayStr) {
        if (l.expiry_date < todayStr) {
          expiredCount++;
        } else {
          activeLicensesCount++;
          if (l.expiry_date <= sevenDaysFromNow) {
            expiringSoonCount++;
          }
        }
      } else {
        expiredCount++;
      }
    }

    return {
      totalClients: activeClientsCount,
      activeLicenses: activeLicensesCount,
      expiringSoon: expiringSoonCount,
      expiredLicenses: expiredCount,
      blockedLicenses: blockedCount,
      totalLogs: this.data.verification_logs.length
    };
  }
}

export const db = new DatabaseService();
