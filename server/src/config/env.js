const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default('naian'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('naian_dev_secret_change_me'),
  JWT_ACCESS_EXPIRES: z.string().default('7d'),
});

const env = envSchema.parse(process.env);

module.exports = env;