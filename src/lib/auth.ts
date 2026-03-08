// Auth utilities using Supabase SDK
import { supabase } from '@/integrations/supabase/client';

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
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('user_id', authUser.id)
    .single();

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authUser.id)
    .single();

  if (!profile) return null;

  return {
    id: authUser.id,
    email: profile.email || authUser.email || '',
    name: profile.name,
    role: (roleData?.role as UserRole) || 'user',
  };
}
