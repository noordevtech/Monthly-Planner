import { db } from "./db";
import { timeSlots, type InsertTimeSlot, type TimeSlot } from "@shared/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  getTimeSlots(month?: string): Promise<TimeSlot[]>;
  createTimeSlot(data: InsertTimeSlot): Promise<TimeSlot>;
  deleteTimeSlot(id: number): Promise<boolean>;
  bulkSaveForDate(date: string, slots: { startTime: string; endTime: string }[]): Promise<TimeSlot[]>;
}

export class DatabaseStorage implements IStorage {
  async getTimeSlots(month?: string): Promise<TimeSlot[]> {
    if (month) {
      const startDate = `${month}-01`;
      const [year, m] = month.split('-');
      const nextMonth = parseInt(m) === 12 ? 1 : parseInt(m) + 1;
      const nextYear = parseInt(m) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

      return await db.select().from(timeSlots)
        .where(and(gte(timeSlots.date, startDate), lt(timeSlots.date, endDate)));
    }
    return await db.select().from(timeSlots);
  }

  async createTimeSlot(data: InsertTimeSlot): Promise<TimeSlot> {
    const [inserted] = await db.insert(timeSlots).values(data).returning();
    return inserted;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    const result = await db.delete(timeSlots).where(eq(timeSlots.id, id)).returning();
    return result.length > 0;
  }

  async bulkSaveForDate(date: string, slots: { startTime: string; endTime: string }[]): Promise<TimeSlot[]> {
    await db.delete(timeSlots).where(eq(timeSlots.date, date));

    if (slots.length === 0) return [];

    const values = slots.map(s => ({ date, startTime: s.startTime, endTime: s.endTime }));
    return await db.insert(timeSlots).values(values).returning();
  }
}

export const storage = new DatabaseStorage();
