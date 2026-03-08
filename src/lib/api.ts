// API layer - now fully Laravel-based
// This file is kept for backward compatibility but delegates to api-client.ts and data.ts
export { apiFetch, apiUpload, getToken, setToken, removeToken, LARAVEL_API_URL } from '@/lib/api-client';
