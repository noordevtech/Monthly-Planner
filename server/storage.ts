import { db } from "./db";
import { workHours, type InsertWorkHours, type WorkHours } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getWorkHours(month?: string): Promise<WorkHours[]>;
  upsertWorkHours(data: InsertWorkHours): Promise<WorkHours>;
}

export class DatabaseStorage implements IStorage {
  async getWorkHours(month?: string): Promise<WorkHours[]> {
    if (month) {
      // Month format: YYYY-MM
      const startDate = `${month}-01`;
      // Create a date for the first of next month to get the end of current month
      const [year, m] = month.split('-');
      const nextMonth = parseInt(m) === 12 ? 1 : parseInt(m) + 1;
      const nextYear = parseInt(m) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

      return await db.select().from(workHours)
        .where(
          and(
            gte(workHours.date, startDate),
            // Less than the first of next month
            lte(workHours.date, endDate) 
          )
        );
    }
    return await db.select().from(workHours);
  }

  async upsertWorkHours(data: InsertWorkHours): Promise<WorkHours> {
    const existing = await db.select().from(workHours).where(eq(workHours.date, data.date));
    
    if (existing.length > 0) {
      const [updated] = await db.update(workHours)
        .set({ hours: data.hours, notes: data.notes })
        .where(eq(workHours.date, data.date))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(workHours)
        .values(data)
        .returning();
      return inserted;
    }
  }
}

export const storage = new DatabaseStorage();
