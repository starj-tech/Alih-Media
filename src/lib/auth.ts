// Simple mock auth store

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const mockUsers: (User & { password: string })[] = [
  { id: '1', email: 'admin@bpn.go.id', password: 'admin123', name: 'Administrator', role: 'admin' },
  { id: '2', email: 'user@bpn.go.id', password: 'user123', name: 'Abdurrohman Muthi', role: 'user' },
];

export function register(name: string, email: string, password: string): User | string {
  const exists = mockUsers.find(u => u.email === email);
  if (exists) return 'Email sudah terdaftar';
  const newUser: User & { password: string } = {
    id: String(mockUsers.length + 1),
    email,
    password,
    name,
    role: 'user',
  };
  mockUsers.push(newUser);
  const { password: _, ...user } = newUser;
  currentUser = user;
  localStorage.setItem('alihmedia_user', JSON.stringify(user));
  listeners.forEach(l => l());
  return user;
}

// Using a simple module-level state since we don't have zustand installed
let currentUser: User | null = null;
let listeners: (() => void)[] = [];

export function getUser() { return currentUser; }

export function login(email: string, password: string): User | null {
  const found = mockUsers.find(u => u.email === email && u.password === password);
  if (found) {
    const { password: _, ...user } = found;
    currentUser = user;
    localStorage.setItem('alihmedia_user', JSON.stringify(user));
    listeners.forEach(l => l());
    return user;
  }
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
    currentUser = JSON.parse(stored);
  }
  return currentUser;
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}
