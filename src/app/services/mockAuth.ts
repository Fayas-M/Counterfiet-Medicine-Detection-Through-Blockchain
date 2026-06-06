// Mock Firebase Authentication Service

export type UserRole = 'manufacturer' | 'retailer' | 'distributor' | 'consumer' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  address: string; // Mock blockchain address
  status: 'pending' | 'approved' | 'rejected';
}

class MockAuthService {
  private currentUser: User | null = null;
  private users: Map<string, User & { password: string }> = new Map();

  constructor() {
    // Add some default users for testing
    this.users.set('manufacturer@example.com', {
      uid: 'mfr-001',
      email: 'manufacturer@example.com',
      password: 'password123',
      role: 'manufacturer',
      name: 'PharmaCorp Manufacturing',
      address: '0xA1b2C3d4E5f6789012345678901234567890aBcD',
      status: 'approved'
    });

    this.users.set('retailer@example.com', {
      uid: 'ret-001',
      email: 'retailer@example.com',
      password: 'password123',
      role: 'retailer',
      name: 'MediStore Pharmacy',
      address: '0xB2c3D4e5F6789012345678901234567890aBcDe',
      status: 'approved'
    });

    this.users.set('consumer@example.com', {
      uid: 'con-001',
      email: 'consumer@example.com',
      password: 'password123',
      role: 'consumer',
      name: 'John Consumer',
      address: '0xC3d4E5f6789012345678901234567890aBcDeF',
      status: 'approved'
    });

    this.users.set('admin@example.com', {
      uid: 'adm-001',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      name: 'System Administrator',
      address: '0xD4e5F6789012345678901234567890aBcDeF1',
      status: 'approved'
    });

    this.users.set('distributor@example.com', {
      uid: 'dis-001',
      email: 'distributor@example.com',
      password: 'password123',
      role: 'distributor',
      name: 'HealthHub Distributor',
      address: '0xE5f6789012345678901234567890aBcDeF12',
      status: 'approved'
    });
  }

  // Sign in
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const userRecord = this.users.get(email);
    
    if (!userRecord || userRecord.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (userRecord.status === 'pending') {
      return { success: false, error: 'Your account is pending approval' };
    }

    if (userRecord.status === 'rejected') {
      return { success: false, error: 'Your account registration was rejected' };
    }

    const { password: _, ...user } = userRecord;
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    return { success: true, user };
  }

  // Register
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    if (this.users.has(email)) {
      return { success: false, error: 'Email already registered' };
    }

    // Consumer accounts are auto-approved. Others require hierarchical approval.
    const status = role === 'consumer' ? 'approved' : 'pending';

    // Generate mock blockchain address only for auto-approved accounts
    const address = status === 'approved' ? ('0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')) : '';

    const user: User = {
      uid: `${role.slice(0, 3)}-${Date.now()}`,
      email,
      role,
      name,
      address,
      status
    };

    this.users.set(email, { ...user, password });
    
    // Automatically log in if approved
    if (status === 'approved') {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user };
    } else {
      // Pending users do not get logged in
      return { success: true, user };
    }
  }

  // Create an approved user directly (used by admins/manufacturers/distributors to manually add subordinates)
  async adminCreateUser(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    providedAddress?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500)); 

    if (this.users.has(email)) {
      return { success: false, error: 'Email already registered' };
    }

    const address = providedAddress || ('0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join(''));

    const user: User = {
      uid: `${role.slice(0, 3)}-${Date.now()}`,
      email,
      role,
      name,
      address,
      status: 'approved' // Manually added users are immediately approved
    };

    this.users.set(email, { ...user, password });

    // Note: We do NOT set this.currentUser or update localStorage.
    // The supervisor remains logged in.
    return { success: true, user };
  }

  // Sign out
  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  // Get current user
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }

    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Get pending users by role
  getPendingUsers(role: UserRole): User[] {
    return Array.from(this.users.values()).filter(u => u.role === role && u.status === 'pending');
  }

  // Update user status
  updateUserStatus(email: string, status: 'approved' | 'rejected', address?: string): boolean {
    const user = this.users.get(email);
    if (user) {
      user.status = status;
      if (status === 'approved' && address) {
        user.address = address;
      }
      this.users.set(email, user);
      return true;
    }
    return false;
  }
}

export const mockAuth = new MockAuthService();
