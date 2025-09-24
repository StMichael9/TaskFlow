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

// Set NODE_ENV for production
console.log("Current NODE_ENV:", process.env.NODE_ENV);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
process.env.NODE_ENV = "production";
console.log("Setting NODE_ENV to production for consistent behavior");
// For debugging purposes, log every request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.headers.origin || 'Unknown Origin'}`);
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request from origin:", origin);
      
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) {
        console.log("No origin provided - allowing request");
        return callback(null, true);
      }

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.FRONTEND_URL,
        "https://task-flow-phi-brown.vercel.app",
      ];
      
      console.log("Allowed origins:", allowedOrigins);

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("Origin explicitly allowed:", origin);
        callback(null, true);
      } else {
        console.log("⚠️ Warning: Allowing origin not in whitelist:", origin);
        callback(null, true); // Temporarily allow all origins for debugging
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    credentials: true, // Allow cookies
  })
);

// Public health-check
app.get("/", (req, res) => {
  res.send("TaskFlow!");
});

// Environment check (for debugging)
app.get("/env-check", (req, res) => {
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const jwtSecretLength = process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0;
  
  res.json({
    nodeEnv: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    hasJwtSecret,
    jwtSecretLength,
    time: new Date().toISOString(),
  });
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
// Apply authenticate middleware correctly
app.use("/api/tracker", authenticate, trackerRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
