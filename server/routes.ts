import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Settings route for OpenAI API key
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ hasOpenaiKey: !!user.openaiApiKey });
  });

  app.patch("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const input = z.object({
        openaiApiKey: z.string().nullable(),
      }).parse(req.body);

      const updated = await storage.updateUserOpenaiKey(userId, input.openaiApiKey);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ hasOpenaiKey: !!updated.openaiApiKey });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Clients routes
  app.get("/api/clients", isAuthenticated, async (_req, res) => {
    const data = await storage.getClients();
    res.json(data);
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const client = await storage.getClient(id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const input = z.object({
        name: z.string().min(1),
        language: z.string().min(1).default("English"),
      }).parse(req.body);
      const result = await storage.createClient(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = z.object({
        name: z.string().min(1),
        language: z.string().min(1).optional(),
      }).parse(req.body);
      const result = await storage.updateClient(id, input);
      if (!result) return res.status(404).json({ message: "Client not found" });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteClient(id);
    if (!deleted) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true });
  });

  // Time slots routes (scoped by client)
  app.get("/api/clients/:clientId/time-slots", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const input = z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM").optional(),
      }).parse(req.query);
      const data = await storage.getTimeSlots(clientId, input.month);
      res.json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/clients/:clientId/time-slots", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const input = z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      }).parse(req.body);
      const result = await storage.createTimeSlot({ clientId, ...input });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/clients/:clientId/time-slots/:id", isAuthenticated, async (req, res) => {
    const clientId = Number(req.params.clientId);
    const id = Number(req.params.id);
    if (isNaN(clientId) || isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteTimeSlot(clientId, id);
    if (!deleted) return res.status(404).json({ message: "Time slot not found" });
    res.json({ success: true });
  });

  app.post("/api/clients/:clientId/time-slots/bulk", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const input = z.object({
        date: z.string(),
        slots: z.array(z.object({
          startTime: z.string(),
          endTime: z.string(),
        })),
      }).parse(req.body);
      const result = await storage.bulkSaveForDate(clientId, input.date, input.slots);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Tasks routes (scoped by client)
  app.get("/api/clients/:clientId/tasks", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const input = z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
      }).parse(req.query);
      const data = await storage.getTasks(clientId, input.date);
      res.json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/clients/:clientId/tasks", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const input = z.object({
        date: z.string(),
        title: z.string().min(1),
      }).parse(req.body);
      const result = await storage.createTask({ clientId, ...input });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/clients/:clientId/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      const id = Number(req.params.id);
      if (isNaN(clientId) || isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const input = z.object({
        title: z.string().optional(),
        completed: z.boolean().optional(),
      }).parse(req.body);
      const result = await storage.updateTask(clientId, id, input);
      if (!result) return res.status(404).json({ message: "Task not found" });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/clients/:clientId/tasks/:id", isAuthenticated, async (req, res) => {
    const clientId = Number(req.params.clientId);
    const id = Number(req.params.id);
    if (isNaN(clientId) || isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteTask(clientId, id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ success: true });
  });

  // AI report generation (scoped by client)
  app.post("/api/clients/:clientId/tasks/report", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.body);
      const tasks = await storage.getTasks(clientId, date);

      if (tasks.length === 0) {
        return res.status(400).json({ message: "No tasks found for this date" });
      }

      const userId = req.user?.claims?.sub;
      const user = await storage.getUserById(userId);
      if (!user?.openaiApiKey) {
        return res.status(400).json({ message: "Please add your OpenAI API key in Settings before generating reports" });
      }

      const client = await storage.getClient(clientId);
      const clientLanguage = client?.language || "English";

      const taskList = tasks.map(t => `- [${t.completed ? "DONE" : "PENDING"}] ${t.title}`).join("\n");

      const openai = new OpenAI({
        apiKey: user.openaiApiKey,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional work report writer. Given a list of tasks for a workday, write a concise daily work report summarizing what was accomplished and what remains. Keep it brief and professional, using 3-5 sentences. IMPORTANT: Write the entire report in ${clientLanguage}.`,
          },
          {
            role: "user",
            content: `Write a daily work report for ${date}.\n\nTasks:\n${taskList}`,
          },
        ],
        max_tokens: 500,
      });

      const reportContent = completion.choices[0]?.message?.content || "Unable to generate report.";
      const existing = await storage.getReportByDate(clientId, date);
      let saved;
      if (existing) {
        saved = await storage.updateReport(clientId, existing.id, reportContent);
      } else {
        saved = await storage.createReport({ clientId, date, content: reportContent });
      }
      res.json({ report: reportContent, saved });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error generating report:", err);
      const message = err instanceof Error && err.message.includes("API key")
        ? "Invalid OpenAI API key. Please check your key in Settings."
        : "Failed to generate report";
      res.status(500).json({ message });
    }
  });

  // Get report for a specific date
  app.get("/api/clients/:clientId/report-by-date", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.query);
      const report = await storage.getReportByDate(clientId, date);
      res.json(report || null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Reports routes (scoped by client)
  app.get("/api/clients/:clientId/reports", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ message: "Invalid client ID" });
      const input = z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM").optional(),
      }).parse(req.query);
      const data = await storage.getReports(clientId, input.month);
      res.json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/clients/:clientId/reports/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      const id = Number(req.params.id);
      if (isNaN(clientId) || isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
      const result = await storage.updateReport(clientId, id, content);
      if (!result) return res.status(404).json({ message: "Report not found" });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/clients/:clientId/reports/:id", isAuthenticated, async (req, res) => {
    const clientId = Number(req.params.clientId);
    const id = Number(req.params.id);
    if (isNaN(clientId) || isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteReport(clientId, id);
    if (!deleted) return res.status(404).json({ message: "Report not found" });
    res.json({ success: true });
  });

  return httpServer;
}
