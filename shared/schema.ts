import { pgTable, serial, text, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
