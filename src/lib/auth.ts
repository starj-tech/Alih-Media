// Simple mock auth store with security hardening

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

const mockUsers: (User & { password: string })[] = [
  { id: '1', email: 'admin@bpn.go.id', password: 'admin123', name: 'Administrator', role: 'admin' },
  { id: '2', email: 'user@bpn.go.id', password: 'user123', name: 'Abdurrohman Muthi', role: 'user' },
];

// Rate limiting for login attempts
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (!record) return { allowed: true };
  if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(email);
    return { allowed: true };
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remainingMs: LOCKOUT_DURATION_MS - (now - record.lastAttempt) };
  }
  return { allowed: true };
}

function recordLoginAttempt(email: string, success: boolean) {
  if (success) {
    loginAttempts.delete(email);
    return;
  }
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (record) {
    record.count += 1;
    record.lastAttempt = now;
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  }
}

// Input sanitization
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s'.,-]+$/.test(name);
}

function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 128;
}

// Safe JSON parse for localStorage
function safeJsonParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    // Validate structure
    if (typeof parsed === 'object' && parsed !== null && 'id' in parsed && 'email' in parsed && 'role' in parsed) {
      // Validate role is expected value
      if (parsed.role !== 'admin' && parsed.role !== 'user') return null;
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}

export function register(name: string, email: string, password: string): User | string {
  const cleanName = sanitizeString(name);
  const cleanEmail = sanitizeString(email).toLowerCase();

  if (!isValidName(cleanName)) return 'Nama tidak valid (2-100 karakter, hanya huruf)';
  if (!isValidEmail(cleanEmail)) return 'Format email tidak valid';
  if (!isValidPassword(password)) return 'Password minimal 6 karakter';

  const exists = mockUsers.find(u => u.email === cleanEmail);
  if (exists) return 'Email sudah terdaftar';

  const newUser: User & { password: string } = {
    id: String(Date.now()),
    email: cleanEmail,
    password,
    name: cleanName,
    role: 'user',
  };
  mockUsers.push(newUser);
  const { password: _, ...user } = newUser;
  currentUser = user;
  localStorage.setItem('alihmedia_user', JSON.stringify(user));
  listeners.forEach(l => l());
  return user;
}

let currentUser: User | null = null;
let listeners: (() => void)[] = [];

export function getUser() { return currentUser; }

export function login(email: string, password: string): User | null | { error: string } {
  const cleanEmail = sanitizeString(email).toLowerCase();

  // Rate limit check
  const rateCheck = checkRateLimit(cleanEmail);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.remainingMs || 0) / 60000);
    return { error: `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.` };
  }

  const found = mockUsers.find(u => u.email === cleanEmail && u.password === password);
  if (found) {
    recordLoginAttempt(cleanEmail, true);
    const { password: _, ...user } = found;
    currentUser = user;
    localStorage.setItem('alihmedia_user', JSON.stringify(user));
    listeners.forEach(l => l());
    return user;
  }

  recordLoginAttempt(cleanEmail, false);
  return null;
}

export function logout() {
  currentUser = null;
  localStorage.removeItem('alihmedia_user');
  listeners.forEach(l => l());
}

export function initAuth(): User | null {
  const stored = localStorage.getItem('alihmedia_user');
  if (stored) {
    const parsed = safeJsonParse<User>(stored);
    if (parsed) {
      currentUser = parsed;
    } else {
      // Invalid/tampered data — clear it
      localStorage.removeItem('alihmedia_user');
    }
  }
  return currentUser;
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

// Export sanitize for use in other components
export { sanitizeString, isValidEmail, isValidName };
