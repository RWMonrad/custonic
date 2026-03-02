import 'server-only';

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// Use for runtime-only code paths
export const DATABASE_URL = process.env.DATABASE_URL;
