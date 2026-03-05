import { db } from "./db";
import { clients, timeSlots, tasks, reports, type Client, type InsertClient, type InsertTimeSlot, type TimeSlot, type InsertTask, type Task, type Report, type InsertReport } from "@shared/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export interface IStorage {
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(data: InsertClient): Promise<Client>;
  updateClient(id: number, data: { name: string }): Promise<Client | null>;
  deleteClient(id: number): Promise<boolean>;
  getTimeSlots(clientId: number, month?: string): Promise<TimeSlot[]>;
  createTimeSlot(data: InsertTimeSlot): Promise<TimeSlot>;
  deleteTimeSlot(clientId: number, id: number): Promise<boolean>;
  bulkSaveForDate(clientId: number, date: string, slots: { startTime: string; endTime: string }[]): Promise<TimeSlot[]>;
  getTasks(clientId: number, date?: string): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(clientId: number, id: number, updates: { title?: string; completed?: boolean }): Promise<Task | null>;
  deleteTask(clientId: number, id: number): Promise<boolean>;
  getReports(clientId: number, month?: string): Promise<Report[]>;
  createReport(data: InsertReport): Promise<Report>;
  deleteReport(clientId: number, id: number): Promise<boolean>;
}

function monthRange(month: string) {
  const startDate = `${month}-01`;
  const [year, m] = month.split('-');
  const nextMonth = parseInt(m) === 12 ? 1 : parseInt(m) + 1;
  const nextYear = parseInt(m) === 12 ? parseInt(year) + 1 : parseInt(year);
  const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
  return { startDate, endDate };
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(data: InsertClient): Promise<Client> {
    const [inserted] = await db.insert(clients).values(data).returning();
    return inserted;
  }

  async updateClient(id: number, data: { name: string }): Promise<Client | null> {
    const result = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  async getTimeSlots(clientId: number, month?: string): Promise<TimeSlot[]> {
    if (month) {
      const { startDate, endDate } = monthRange(month);
      return await db.select().from(timeSlots)
        .where(and(eq(timeSlots.clientId, clientId), gte(timeSlots.date, startDate), lt(timeSlots.date, endDate)));
    }
    return await db.select().from(timeSlots).where(eq(timeSlots.clientId, clientId));
  }

  async createTimeSlot(data: InsertTimeSlot): Promise<TimeSlot> {
    const [inserted] = await db.insert(timeSlots).values(data).returning();
    return inserted;
  }

  async deleteTimeSlot(clientId: number, id: number): Promise<boolean> {
    const result = await db.delete(timeSlots).where(and(eq(timeSlots.id, id), eq(timeSlots.clientId, clientId))).returning();
    return result.length > 0;
  }

  async bulkSaveForDate(clientId: number, date: string, slots: { startTime: string; endTime: string }[]): Promise<TimeSlot[]> {
    await db.delete(timeSlots).where(and(eq(timeSlots.clientId, clientId), eq(timeSlots.date, date)));
    if (slots.length === 0) return [];
    const values = slots.map(s => ({ clientId, date, startTime: s.startTime, endTime: s.endTime }));
    return await db.insert(timeSlots).values(values).returning();
  }

  async getTasks(clientId: number, date?: string): Promise<Task[]> {
    if (date) {
      return await db.select().from(tasks).where(and(eq(tasks.clientId, clientId), eq(tasks.date, date)));
    }
    return await db.select().from(tasks).where(eq(tasks.clientId, clientId));
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [inserted] = await db.insert(tasks).values(data).returning();
    return inserted;
  }

  async updateTask(clientId: number, id: number, updates: { title?: string; completed?: boolean }): Promise<Task | null> {
    const result = await db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.clientId, clientId))).returning();
    return result.length > 0 ? result[0] : null;
  }

  async deleteTask(clientId: number, id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.clientId, clientId))).returning();
    return result.length > 0;
  }

  async getReports(clientId: number, month?: string): Promise<Report[]> {
    if (month) {
      const { startDate, endDate } = monthRange(month);
      return await db.select().from(reports)
        .where(and(eq(reports.clientId, clientId), gte(reports.date, startDate), lt(reports.date, endDate)))
        .orderBy(reports.date);
    }
    return await db.select().from(reports).where(eq(reports.clientId, clientId)).orderBy(reports.date);
  }

  async createReport(data: InsertReport): Promise<Report> {
    const [inserted] = await db.insert(reports).values(data).returning();
    return inserted;
  }

  async deleteReport(clientId: number, id: number): Promise<boolean> {
    const result = await db.delete(reports).where(and(eq(reports.id, id), eq(reports.clientId, clientId))).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
