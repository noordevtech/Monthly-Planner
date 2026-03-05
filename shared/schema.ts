import { pgTable, serial, integer, text, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workHours = pgTable("work_hours", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // Format: YYYY-MM-DD
  hours: integer("hours").notNull().default(0),
  notes: text("notes"),
});

export const insertWorkHoursSchema = createInsertSchema(workHours).omit({ id: true });

export type InsertWorkHours = z.infer<typeof insertWorkHoursSchema>;
export type WorkHours = typeof workHours.$inferSelect;
