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
    origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both frontend ports
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Added PATCH method
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // <-- allow cookies
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
