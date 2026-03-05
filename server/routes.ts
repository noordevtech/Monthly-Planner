import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.timeSlots.list.path, async (req, res) => {
    try {
      const input = api.timeSlots.list.input?.parse(req.query) || {};
      const data = await storage.getTimeSlots(input.month);
      res.json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.post(api.timeSlots.create.path, async (req, res) => {
    try {
      const input = api.timeSlots.create.input.parse(req.body);
      const result = await storage.createTimeSlot(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.timeSlots.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteTimeSlot(id);
    if (!deleted) {
      return res.status(404).json({ message: "Time slot not found" });
    }
    res.json({ success: true });
  });

  app.post(api.timeSlots.bulkSave.path, async (req, res) => {
    try {
      const input = api.timeSlots.bulkSave.input.parse(req.body);
      const result = await storage.bulkSaveForDate(input.date, input.slots);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Seed data on first run
  const existing = await storage.getTimeSlots();
  if (existing.length === 0) {
    await storage.bulkSaveForDate("2026-03-02", [
      { startTime: "11h00", endTime: "16h30" },
      { startTime: "11h00", endTime: "16h30" },
    ]);
    await storage.bulkSaveForDate("2026-03-03", [
      { startTime: "11h00", endTime: "16h30" },
      { startTime: "11h00", endTime: "16h30" },
    ]);
    await storage.bulkSaveForDate("2026-03-06", [
      { startTime: "8h30", endTime: "12h" },
      { startTime: "8h30", endTime: "12h" },
    ]);
    await storage.bulkSaveForDate("2026-03-09", [
      { startTime: "11h00", endTime: "16h30" },
      { startTime: "11h00", endTime: "16h30" },
    ]);
    await storage.bulkSaveForDate("2026-03-10", [
      { startTime: "11h00", endTime: "16h30" },
      { startTime: "11h00", endTime: "16h30" },
    ]);
    await storage.bulkSaveForDate("2026-03-11", [
      { startTime: "11h00", endTime: "16h30" },
      { startTime: "11h00", endTime: "16h30" },
    ]);
    await storage.bulkSaveForDate("2026-03-13", [
      { startTime: "8h30", endTime: "12h" },
      { startTime: "8h30", endTime: "12h" },
    ]);
  }

  return httpServer;
}
