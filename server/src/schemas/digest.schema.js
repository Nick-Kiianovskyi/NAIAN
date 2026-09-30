const { z } = require('zod');

const generateDigestSchema = z.object({
  region_id: z.coerce.number().int().positive().optional(),
  topic_ids: z.array(z.coerce.number().int().positive()).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

module.exports = { generateDigestSchema };