const { z } = require('zod');

const createSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  domain: z.string().max(255).optional().nullable(),
  type: z.enum(['news', 'tv', 'radio', 'blog', 'telegram', 'other']).default('news'),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2').default('UA'),
  language: z.string().max(10).default('uk'),
  reliability: z.number().min(0).max(1).optional().nullable(),
  bias: z
    .enum(['neutral', 'pro-government', 'opposition', 'independent', 'unknown'])
    .optional()
    .nullable(),
  scraping_priority: z.number().int().min(1).max(5).default(1),
  is_active: z.boolean().default(true),
});

const updateSourceSchema = createSourceSchema.partial();

module.exports = { createSourceSchema, updateSourceSchema };