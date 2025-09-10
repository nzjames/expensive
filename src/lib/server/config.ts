export function getDbPath(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  return process.env.NODE_ENV === 'production' ? 'expense-prod.db' : 'expense-dev.db';
}

