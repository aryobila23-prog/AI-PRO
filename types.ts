export type Role = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  passwordHash: string; // In a real app, this would be hashed. Storing plain for mock.
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  dailyRequestLimit: number;
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  expiresAt: string;
  status: 'active' | 'expired';
}

export interface Payment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface UsageLog {
  userId: string;
  date: string; // YYYY-MM-DD
  count: number;
}

export interface SiteSettings {
  siteName: string;
  currency: string;
  maintenanceMode: boolean;
}