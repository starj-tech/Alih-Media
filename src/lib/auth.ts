// Auth utilities using Custom REST API
import { api } from '@/lib/api';

export type UserRole = 'admin' | 'user' | 'super_admin' | 'super_user' | 'admin_arsip' | 'admin_validasi_su' | 'admin_validasi_bt';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Input sanitization
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s'.,-]+$/.test(name);
}

export function isAdminRole(role: UserRole): boolean {
  return ['admin', 'super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt'].includes(role);
}

export function isSuperUser(role: UserRole): boolean {
  return role === 'super_user';
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'admin_arsip': return 'Admin Arsip BT/SU';
    case 'admin_validasi_su': return 'Admin Validasi SU & Bidang';
    case 'admin_validasi_bt': return 'Admin Validasi BT';
    case 'super_user': return 'Super User';
    case 'user': return 'User';
  }
}

export async function getUserProfile(): Promise<User | null> {
  const { data, error } = await api.get<User>('/auth/profile');
  if (error || !data) return null;
  return data;
}
