// Supabase configuration override for standalone deployment
// When deploying to your own hosting (Vercel/Netlify), set these env vars:
// VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

// Target Supabase project: zickawmielbmqwgphels
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://zickawmielbmqwgphels.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppY2thd21pZWxibXF3Z3BoZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDIyOTEsImV4cCI6MjA4MzgxODI5MX0.CY_dKH27js9XdrVUmnz1cIG3UY9YhYPcOTWrVtWLwmc',
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zickawmielbmqwgphels',
} as const;
