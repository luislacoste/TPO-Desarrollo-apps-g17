import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`[config] falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', '4000')),

  db: {
    host:     required('DB_HOST',     'localhost'),
    port:     Number(required('DB_PORT', '5432')),
    name:     required('DB_NAME',     'subastar'),
    user:     required('DB_USER',     'postgres'),
    password: required('DB_PASSWORD', 'postgres'),
    poolMax:  Number(process.env.DB_POOL_MAX ?? 10),
  },

  jwt: {
    secret:           required('JWT_SECRET', 'dev-change-me'),
    expiresIn:        required('JWT_EXPIRES_IN', '1h'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  uploads: {
    dir:        required('UPLOAD_DIR', './uploads'),
    maxSizeMb:  Number(required('MAX_FILE_SIZE_MB', '5')),
  },

  fines: {
    percentage:    Number(required('FINE_PERCENTAGE', '10')),
    deadlineHours: Number(required('FINE_DEADLINE_HOURS', '72')),
  },
} as const;

export type Env = typeof env;
