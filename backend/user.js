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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many login attempts, please try again later" },
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

      // sign token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      // set cookie + return user
      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000, // 15 minutes
        })
        .status(201)
        .json({
          user: { id: user.id, email: user.email, username: user.username },
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

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        })
        .json({ message: "Logged in" });
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({ message: "Logged out successfully" });
});

export default router;
