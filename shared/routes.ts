import { z } from 'zod';
import { insertWorkHoursSchema, workHours } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  workHours: {
    list: {
      method: 'GET' as const,
      path: '/api/work-hours' as const,
      input: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM").optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof workHours.$inferSelect>()),
      },
    },
    upsert: {
      method: 'POST' as const,
      path: '/api/work-hours' as const,
      input: insertWorkHoursSchema,
      responses: {
        200: z.custom<typeof workHours.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
