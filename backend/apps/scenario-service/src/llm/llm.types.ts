import { z } from 'zod';

const translationPairSchema = z.object({
  en: z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional() }),
  ru: z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional() }),
});

export const llmDeviceCatalogSchema = z.object({
  category: translationPairSchema,
  device: translationPairSchema,
  functions: z
    .array(
      z.object({
        code: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-z][a-z0-9_]*$/, 'must be lower_snake_case'),
        type: z.enum(['READ', 'WRITE', 'READ_WRITE']),
        en: z.object({ name: z.string().min(1).max(100) }),
        ru: z.object({ name: z.string().min(1).max(100) }),
      }),
    )
    .max(20),
});

export type LlmDeviceCatalogResult = z.infer<typeof llmDeviceCatalogSchema>;
