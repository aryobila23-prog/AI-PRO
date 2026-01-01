import { User, Plan, Subscription, Payment, UsageLog, SiteSettings } from '../types';
import { INITIAL_PLANS, DEFAULT_SETTINGS, INITIAL_ADMIN } from '../constants';

// Simulating a PHP+MySQL backend using LocalStorage
class MockDB {
  private get <T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Users
  getUsers(): User[] {
    const users = this.get<User[]>('users', []);
    if (users.length === 0) {
      // Seed admin
      users.push(INITIAL_ADMIN);
      this.set('users', users);
    }
    return users;
  }

  createUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.set('users', users);
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email === email);
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    this.set('users', users);
  }

  // Plans
  getPlans(): Plan[] {
    return this.get<Plan[]>('plans', INITIAL_PLANS);
  }

  savePlan(plan: Plan): void {
    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }
    this.set('plans', plans);
  }

  deletePlan(planId: string): void {
    const plans = this.getPlans().filter(p => p.id !== planId);
    this.set('plans', plans);
  }

  // Subscriptions
  getSubscription(userId: string): Subscription | undefined {
    const subs = this.get<Subscription[]>('subscriptions', []);
    return subs.find(s => s.userId === userId && s.status === 'active');
  }

  activateSubscription(sub: Subscription): void {
    let subs = this.get<Subscription[]>('subscriptions', []);
    // Deactivate old active subs for this user
    subs = subs.map(s => s.userId === sub.userId ? { ...s, status: 'expired' as const } : s);
    subs.push(sub);
    this.set('subscriptions', subs);
  }

  // Usage Logs
  getUsage(userId: string): number {
    const logs = this.get<UsageLog[]>('usage_logs', []);
    const today = new Date().toISOString().split('T')[0];
    const log = logs.find(l => l.userId === userId && l.date === today);
    return log ? log.count : 0;
  }

  incrementUsage(userId: string): void {
    const logs = this.get<UsageLog[]>('usage_logs', []);
    const today = new Date().toISOString().split('T')[0];
    const index = logs.findIndex(l => l.userId === userId && l.date === today);
    
    if (index >= 0) {
      logs[index].count += 1;
    } else {
      logs.push({ userId, date: today, count: 1 });
    }
    this.set('usage_logs', logs);
  }

  getAllUsageStats(): UsageLog[] {
    return this.get<UsageLog[]>('usage_logs', []);
  }

  // Payments
  getPayments(): Payment[] {
    return this.get<Payment[]>('payments', []);
  }

  createPayment(payment: Payment): void {
    const payments = this.getPayments();
    payments.push(payment);
    this.set('payments', payments);
  }

  updatePaymentStatus(paymentId: string, status: 'paid' | 'failed'): void {
    const payments = this.getPayments();
    const p = payments.find(py => py.id === paymentId);
    if (p) {
      p.status = status;
      this.set('payments', payments);
      
      // If paid, activate subscription
      if (status === 'paid') {
        const plan = this.getPlans().find(pl => pl.id === p.planId);
        if (plan) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
          this.activateSubscription({
            id: crypto.randomUUID(),
            userId: p.userId,
            planId: p.planId,
            startDate: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active'
          });
        }
      }
    }
  }

  // Settings
  getSettings(): SiteSettings {
    return this.get<SiteSettings>('settings', DEFAULT_SETTINGS);
  }

  saveSettings(settings: SiteSettings): void {
    this.set('settings', settings);
  }
}

export const db = new MockDB();