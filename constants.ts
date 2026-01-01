import { Plan, SiteSettings } from './types';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    durationDays: 3650, // Effectively forever
    dailyRequestLimit: 5,
    features: ['Basic AI Access', 'Community Support', 'Slow Speed']
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    durationDays: 30,
    dailyRequestLimit: 50,
    features: ['Faster Response', 'Email Support', '50 Daily Requests']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    durationDays: 30,
    dailyRequestLimit: 150,
    features: ['High Speed', 'Priority Support', '150 Daily Requests', 'Advanced Models']
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 99.99,
    durationDays: 30,
    dailyRequestLimit: 1000,
    features: ['Unlimited Speed', '24/7 Support', '1000 Daily Requests', 'Early Access']
  }
];

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'AI Pro Platform',
  currency: 'USD',
  maintenanceMode: false
};

// Seed admin user for access
// Email: admin@example.com
// Pass: admin123
export const INITIAL_ADMIN = {
  id: 'admin-1',
  username: 'Admin',
  email: 'admin@example.com',
  passwordHash: 'admin123',
  role: 'admin' as const,
  createdAt: new Date().toISOString()
};