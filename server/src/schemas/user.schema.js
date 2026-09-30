const { z } = require('zod');

const updateMeSchema = z.object({
  displayName: z.string().max(150).optional().nullable(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
});

module.exports = { updateMeSchema };