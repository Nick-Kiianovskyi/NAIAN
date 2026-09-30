const { z } = require('zod');

const preferenceItemSchema = z
  .object({
    region_id: z.number().int().positive().optional().nullable(),
    topic_id: z.number().int().positive().optional().nullable(),
  })
  .refine((item) => item.region_id != null || item.topic_id != null, {
    message: 'Each preference item must have region_id or topic_id',
  });

const putPreferencesSchema = z
  .object({
    digest_frequency: z.enum(['daily', 'weekly', 'monthly', 'off']).optional(),
    notify_email: z.boolean().optional(),
    importance_min: z.number().int().min(0).max(100).optional(),
    items: z.array(preferenceItemSchema).optional(),
  })
  .refine(
    (data) =>
      data.items !== undefined ||
      data.digest_frequency !== undefined ||
      data.notify_email !== undefined ||
      data.importance_min !== undefined,
    { message: 'Nothing to update' }
  );

module.exports = { putPreferencesSchema };