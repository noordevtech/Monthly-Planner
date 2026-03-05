import { db } from "./db";
import { timeSlots, tasks, type InsertTimeSlot, type TimeSlot, type InsertTask, type Task } from "@shared/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  getTimeSlots(month?: string): Promise<TimeSlot[]>;
  createTimeSlot(data: InsertTimeSlot): Promise<TimeSlot>;
  deleteTimeSlot(id: number): Promise<boolean>;
  bulkSaveForDate(date: string, slots: { startTime: string; endTime: string }[]): Promise<TimeSlot[]>;
  getTasks(date?: string): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: number, updates: { title?: string; completed?: boolean }): Promise<Task | null>;
  deleteTask(id: number): Promise<boolean>;
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

  async getTasks(date?: string): Promise<Task[]> {
    if (date) {
      return await db.select().from(tasks).where(eq(tasks.date, date));
    }
    return await db.select().from(tasks);
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [inserted] = await db.insert(tasks).values(data).returning();
    return inserted;
  }

  async updateTask(id: number, updates: { title?: string; completed?: boolean }): Promise<Task | null> {
    const result = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
