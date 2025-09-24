import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import users from "./user.js"; // your signup/login router
import { authenticate } from "./auth.js"; // your JWT-check middleware
import tasksRouter from "./Tasks.js"; // your tasks router
import notesRouter from "./notes.js"; // your notes router
import trackerRouter from "./TimeTracker.js"; // your tracker router

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.FRONTEND_URL,
        "https://task-flow-phi-brown.vercel.app",
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(null, true); // Temporarily allow all origins for debugging
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies
  })
);

// Public health-check
app.get("/", (req, res) => {
  res.send("TaskFlow!");
});

// Mount your signup/login routes under /auth
// • POST /auth/signup
// • POST /auth/login
app.use("/auth", users);

// A protected route to verify token + fetch current user
// GET /auth/me
app.get("/auth/me", authenticate, (req, res) => {
  res.json({
    message: "Authorized",
    user: req.user,
  });
});

// Mount tasks routes under /api/tasks
app.use("/api/tasks", tasksRouter);

// Mount notes routes under /api/notes
app.use("/api/notes", notesRouter);

// Mount tracker routes under /api/tracker
app.use("/api/tracker", trackerRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
