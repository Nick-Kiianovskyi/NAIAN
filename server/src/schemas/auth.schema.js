const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  displayName: z.string().max(150).optional().nullable(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };