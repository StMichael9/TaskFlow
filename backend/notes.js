import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all notes for authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    const { type } = req.query; // Get type filter from query params

    const whereCondition = { userId: req.user.id };
    if (type && (type === "regular" || type === "sticky")) {
      whereCondition.type = type;
    }

    const notes = await prisma.note.findMany({
      where: whereCondition,
      orderBy: { updatedAt: "desc" },
    });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Get a specific note
router.get("/:id", authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id,
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// Create a new note
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, category, type } = req.body;

    // Default to "Untitled" if title is empty or not provided
    const noteTitle = !title || !title.trim() ? "Untitled" : title.trim();

    const note = await prisma.note.create({
      data: {
        title: noteTitle,
        content: content || "",
        category: category || "General",
        type: type || "regular", // Default to "regular" if not specified
        userId: req.user.id,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// Update a note
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, content, category, type } = req.body;
    const noteId = parseInt(req.params.id);

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        updatedAt: new Date(),
      },
    });

    res.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// Delete a note
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);

    // Check if note exists and belongs to user
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.user.id,
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Search notes
router.get("/search/:query", authenticate, async (req, res) => {
  try {
    const query = req.params.query;

    const notes = await prisma.note.findMany({
      where: {
        userId: req.user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(notes);
  } catch (error) {
    console.error("Error searching notes:", error);
    res.status(500).json({ error: "Failed to search notes" });
  }
});

export default router;
