import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js"; // your JWT-check middleware
import { body, validationResult } from "express-validator";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// All routes here will be protected and require authentication
router.use(authenticate);

// GET /api/tasks - Get all tasks for the authenticated user
router.get("/", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /api/tasks - Create a new task
router.post(
  "/",
  [body("title").trim().notEmpty().withMessage("Task title is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title } = req.body;
      const task = await prisma.task.create({
        data: {
          title,
          userId: req.user.id,
        },
      });
      res.status(201).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create task" });
    }
  }
);

// PUT /api/tasks/:id - Update a task
router.put(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Task title cannot be empty"),
    body("completed")
      .optional()
      .isBoolean()
      .withMessage("Completed must be a boolean"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { title, completed } = req.body;

      // Check if task exists and belongs to user
      const existingTask = await prisma.task.findFirst({
        where: { id: parseInt(id), userId: req.user.id },
      });

      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const task = await prisma.task.update({
        where: { id: parseInt(id) },
        data: { title, completed },
      });

      res.json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update task" });
    }
  }
);

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

export default router;
