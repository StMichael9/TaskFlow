import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Get all trackers for logged-in user
router.get("/", async (req, res) => {
  try {
    const trackers = await prisma.tracker.findMany({
      where: { userId: req.user.id },
      include: { sessions: true }, // include session history
    });
    res.json(trackers);
  } catch (error) {
    console.error("Error fetching trackers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Create a new tracker (goal)
router.post("/", authenticate, async (req, res) => {
  const { title, targetDuration, weeklyGoal } = req.body;

  try {
    const tracker = await prisma.tracker.create({
      data: {
        title,
        targetDuration,
        weeklyGoal,
        userId: req.user.id,
      },
    });
    res.status(201).json(tracker);
  } catch (error) {
    console.error("Error creating tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start tracking
router.patch("/:id/start", authenticate, async (req, res) => {
  const trackerId = parseInt(req.params.id);

  try {
    const tracker = await prisma.tracker.update({
      where: { id: trackerId },
      data: {
        isRunning: true,
        startTime: new Date(),
        sessions: {
          create: { startTime: new Date() }, // new session
        },
      },
    });
    res.json(tracker);
  } catch (error) {
    console.error("Error starting tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Stop tracking
router.patch("/:id/stop", authenticate, async (req, res) => {
  const trackerId = parseInt(req.params.id);

  try {
    const tracker = await prisma.tracker.findUnique({
      where: { id: trackerId },
      include: { sessions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!tracker || !tracker.isRunning) {
      return res.status(400).json({ error: "Tracker not running" });
    }

    const session = tracker.sessions[0];
    const endTime = new Date();
    const duration = Math.floor((endTime - new Date(session.startTime)) / 1000); // seconds

    // update tracker + last session
    const updatedTracker = await prisma.tracker.update({
      where: { id: trackerId },
      data: {
        isRunning: false,
        totalTime: tracker.totalTime + duration,
        sessions: {
          update: {
            where: { id: session.id },
            data: { endTime, duration },
          },
        },
      },
      include: { sessions: true },
    });

    res.json(updatedTracker);
  } catch (error) {
    console.error("Error stopping tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Delete tracker
router.delete("/:id", authenticate, async (req, res) => {
  const trackerId = parseInt(req.params.id);

  try {
    // First delete all sessions related to this tracker
    await prisma.session.deleteMany({
      where: { trackerId },
    });

    // Then delete the tracker
    const deletedTracker = await prisma.tracker.delete({
      where: { id: trackerId },
    });

    res.json({ message: "Tracker deleted successfully", id: trackerId });
  } catch (error) {
    console.error("Error deleting tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Sync tracker (update total time without stopping)
router.post("/:id/sync", authenticate, async (req, res) => {
  const trackerId = parseInt(req.params.id);

  try {
    const tracker = await prisma.tracker.findUnique({
      where: { id: trackerId },
      include: { sessions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!tracker || !tracker.isRunning) {
      return res.status(400).json({ error: "Tracker not running" });
    }

    const session = tracker.sessions[0];
    const now = new Date();
    const elapsedSinceStart = Math.floor(
      (now - new Date(session.startTime)) / 1000
    ); // seconds

    // Update tracker with current elapsed time
    const updatedTracker = await prisma.tracker.update({
      where: { id: trackerId },
      data: {
        totalTime: tracker.totalTime + elapsedSinceStart,
        // Reset the start time to now
        startTime: now,
        sessions: {
          update: {
            where: { id: session.id },
            data: {
              startTime: now,
              // Add previous elapsed time to duration
              duration: (session.duration || 0) + elapsedSinceStart,
            },
          },
        },
      },
    });

    res.json(updatedTracker);
  } catch (error) {
    console.error("Error syncing tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
