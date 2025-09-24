// backend/Auth/auth.js
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

export const authenticate = async (req, res, next) => {
  try {
    // 1️⃣ Read the token from the HttpOnly cookie
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "No auth token provided" });
    }

    // 2️⃣ Verify and decode
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Fetch user (optional, but good to confirm they still exist)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4️⃣ Attach user to request and continue
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default authenticate;
