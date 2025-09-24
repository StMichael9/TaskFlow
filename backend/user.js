// backend/Models/user.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (as requested)
  max: 5, // 5 attempts
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Must be a valid email")
      .normalizeEmail(),
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("username must be 3+ chars"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("password must be 6+ chars"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, username, password } = req.body;

    try {
      // check duplicates
      if (await prisma.user.findUnique({ where: { username } })) {
        return res.status(409).json({ message: "Username already taken" });
      }
      if (await prisma.user.findUnique({ where: { email } })) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // hash & create
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, username, password: hashed },
      });
      
      console.log("User created successfully:", user.id);

      // sign token with proper payload structure
      const payload = { userId: user.id };
      console.log("Creating token with payload:", payload);
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      // set cookie + return user
      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: true, // Always use secure cookies
          sameSite: "none", // Required for cross-site cookies
          maxAge: 15 * 60 * 1000, // 15 minutes
          // Don't set domain to allow the browser to handle it correctly
        })
        .status(201)
        .json({
          user: { id: user.id, email: user.email, username: user.username },
          token: token, // Include token in response body for localStorage fallback
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/login",
  loginLimiter,
  [
    body("username").trim().notEmpty().withMessage("username is required"),
    body("password").notEmpty().withMessage("password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create token with proper payload structure
      const payload = { userId: user.id };
      console.log("Creating login token with payload:", payload);
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: true, // Always use secure cookies
          sameSite: "none", // Required for cross-site cookies
          maxAge: 15 * 60 * 1000,
          // Don't set domain to allow the browser to handle it correctly
        })
        .json({
          message: "Logged in",
          token: token, // Include token in response body for localStorage fallback
          user: { id: user.id, email: user.email, username: user.username },
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post("/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: true, // Always use secure cookies
      sameSite: "none", // Required for cross-site cookies
      // Don't set domain to allow the browser to handle it correctly
    })
    .json({ message: "Logged out successfully" });
});

export default router;
