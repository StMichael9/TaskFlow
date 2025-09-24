// src/Auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import BACKEND_URL from "../utils/apiConfig";

const AuthContext = createContext();

// Use the centralized API config
const API = BACKEND_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 1️⃣ On mount (or after login/signup), load current user from the cookie or token
  const loadUser = async () => {
    try {
      // Try to get token from localStorage as a fallback
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log("Fetching user with token in localStorage:", !!token);

      const res = await fetch(`${API}/auth/me`, {
        credentials: "include", // send HttpOnly cookie
        headers: headers,
      });

      if (!res.ok) {
        console.error(`Authentication failed with status ${res.status}`);
        throw new Error("Not authenticated");
      }
      
      const data = await res.json();
      console.log("User data loaded:", data);
      
      if (data && data.user) {
        setUser(data.user);
        console.log("User authenticated successfully:", data.user.username);
      } else {
        console.warn("Response contained no user data");
        setUser(null);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // 2️⃣ signup: POST /auth/signup → sets cookie on server, then reload user
  const signup = async ({ email, username, password }) => {
    try {
      console.log("Attempting signup with:", { email, username });
      
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      // Clone the response for potential error handling
      const clonedRes = res.clone();
      
      // Get the response body
      let data;
      try {
        data = await res.json();
        console.log("Signup response status:", res.status, "data:", data);
      } catch (e) {
        console.error("Error parsing response JSON:", e);
        data = {};
      }

      // Check if the request was successful
      if (!res.ok) {
        console.error("Signup failed with status:", res.status);
        throw new Error(data.message || data.errors?.[0]?.msg || "Signup failed");
      }
      
      // If we get a token in the response, store it as fallback
      if (data && data.token) {
        localStorage.setItem("authToken", data.token);
        console.log("Token stored in localStorage");
        
        // If user info is included in the response, set it directly
        if (data.user) {
          console.log("Setting user from signup response");
          setUser(data.user);
          return; // Skip loadUser call since we already have user data
        }
      }

      await loadUser();
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };  // 3️⃣ login: POST /auth/login → sets cookie on server, then reload user
  const login = async ({ username, password }) => {
    try {
      console.log("Attempting login with username:", username);
      
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // Clone the response for potential error handling
      const clonedRes = res.clone();
      
      // Get the response body
      let data;
      try {
        data = await res.json();
        console.log("Login response status:", res.status, "data:", data);
      } catch (e) {
        console.error("Error parsing response JSON:", e);
        data = {};
      }
      
      // Check if the request was successful
      if (!res.ok) {
        console.error("Login failed with status:", res.status);
        throw new Error(data.message || "Login failed");
      }

      // If we get a token in the response, store it as fallback
      if (data && data.token) {
        localStorage.setItem("authToken", data.token);
        // If user info is included in the response, set it directly
        if (data.user) {
          setUser(data.user);
          return; // Skip loadUser call since we already have user data
        }
      }

      await loadUser();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // 4️⃣ logout: POST /auth/logout → clears cookie, then clear client state
  const logout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
