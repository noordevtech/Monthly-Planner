import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Time slots routes
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
    if (!deleted) return res.status(404).json({ message: "Time slot not found" });
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

  // Tasks routes
  app.get(api.tasks.list.path, async (req, res) => {
    try {
      const input = api.tasks.list.input?.parse(req.query) || {};
      const data = await storage.getTasks(input.date);
      res.json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const result = await storage.createTask(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      const result = await storage.updateTask(id, input);
      if (!result) return res.status(404).json({ message: "Task not found" });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteTask(id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ success: true });
  });

  // AI report generation
  app.post("/api/tasks/report", async (req, res) => {
    try {
      const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.body);
      const tasks = await storage.getTasks(date);

      if (tasks.length === 0) {
        return res.status(400).json({ message: "No tasks found for this date" });
      }

      const taskList = tasks.map(t => `- [${t.completed ? "DONE" : "PENDING"}] ${t.title}`).join("\n");

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional work report writer. Given a list of tasks for a workday, write a concise daily work report summarizing what was accomplished and what remains. Keep it brief and professional, using 3-5 sentences.",
          },
          {
            role: "user",
            content: `Write a daily work report for ${date}.\n\nTasks:\n${taskList}`,
          },
        ],
        max_tokens: 500,
      });

      const report = completion.choices[0]?.message?.content || "Unable to generate report.";
      res.json({ report });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error generating report:", err);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Seed time slots on first run
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
