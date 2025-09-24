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
    // Log request details for debugging
    console.log("⚠️ Auth Debug ⚠️");
    console.log("URL:", req.originalUrl);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Cookies:", JSON.stringify(req.cookies, null, 2));
    console.log("Origin:", req.headers.origin);

    // 1️⃣ Read the token from the HttpOnly cookie or Authorization header
    let token = req.cookies?.token;
    console.log("Cookie token found:", !!token);

    // Fallback to Authorization header if cookie isn't present
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log("Authorization header token found");
      }
    }

    if (!token) {
      console.log("🚫 No auth token provided from any source");
      return res.status(401).json({ message: "No auth token provided" });
    }

    console.log("Token verification attempt...");
    // Don't log the actual token for security
    
    try {
      // 2️⃣ Verify and decode
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified successfully, userId:", payload.userId);
      
      // 3️⃣ Fetch user (optional, but good to confirm they still exist)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      
      if (!user) {
        console.log("User not found in database for userId:", payload.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User found:", user.username);
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError.name, jwtError.message);
      return res.status(403).json({ 
        message: "Invalid or expired token", 
        error: jwtError.name 
      });
    }

    // 4️⃣ Attach user to request and continue
    req.user = user;
    next();
  } catch (err) {
    // We only reach here if there was an error outside the JWT verification try/catch
    console.error("Unexpected auth middleware error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default authenticate;
