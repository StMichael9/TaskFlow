// src/Authentication/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Replace 3000 with whatever port your Express backend runs on
const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 1️⃣ On mount (or after login/signup), load current user from the cookie
  const loadUser = async () => {
    try {
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include", // send HttpOnly cookie
      });
      if (!res.ok) throw new Error("Not authenticated");
      const { user } = await res.json();
      setUser(user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // 2️⃣ signup: POST /auth/signup → sets cookie on server, then reload user
  const signup = async ({ email, username, password }) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Signup failed");
    }
    await loadUser();
  };

  // 3️⃣ login: POST /auth/login → sets cookie on server, then reload user
  const login = async ({ username, password }) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }
    await loadUser();
  };

  // 4️⃣ logout: POST /auth/logout (you’ll create this endpoint) → clears cookie, then clear client state
  const logout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
