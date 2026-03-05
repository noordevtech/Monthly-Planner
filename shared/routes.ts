import { z } from 'zod';
import { insertTimeSlotSchema, insertTaskSchema, timeSlots, tasks } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  timeSlots: {
    list: {
      method: 'GET' as const,
      path: '/api/time-slots' as const,
      input: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM").optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof timeSlots.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/time-slots' as const,
      input: insertTimeSlotSchema,
      responses: {
        201: z.custom<typeof timeSlots.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/time-slots/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    bulkSave: {
      method: 'POST' as const,
      path: '/api/time-slots/bulk' as const,
      input: z.object({
        date: z.string(),
        slots: z.array(z.object({
          startTime: z.string(),
          endTime: z.string(),
        })),
      }),
      responses: {
        200: z.array(z.custom<typeof timeSlots.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks' as const,
      input: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks' as const,
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id' as const,
      input: z.object({
        title: z.string().optional(),
        completed: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
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
