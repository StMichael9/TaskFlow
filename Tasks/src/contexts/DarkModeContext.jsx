import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(null); // Start with null to indicate loading
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize dark mode based on user preference or system preference
  useEffect(() => {
    // Create a storage key
    const storageKey = "darkMode";

    // Try to get saved preference from localStorage
    const savedTheme = localStorage.getItem(storageKey);

    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    // Apply the correct theme in order of precedence:
    // 1. Saved user preference
    // 2. System preference
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "true");
    } else {
      setIsDarkMode(prefersDark);
    }

    // Mark as initialized to prevent flashing
    setIsInitialized(true);
  }, []); // Only run on mount

  // Apply dark mode class to document and save to localStorage
  useEffect(() => {
    // Only proceed if we've initialized (prevents flashing)
    if (isDarkMode === null || !isInitialized) return;

    // Apply the class to document immediately
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save preference to localStorage
    const storageKey = "darkMode";
    localStorage.setItem(storageKey, isDarkMode.toString());
  }, [isDarkMode, isInitialized]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Even during initialization, we still need to provide the context
  // Just use a default value until the real one is loaded
  return (
    <DarkModeContext.Provider
      value={{
        isDarkMode: isDarkMode === null ? false : isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};
