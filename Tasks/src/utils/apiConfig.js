// This file centralizes API configuration to make it easier to debug and update
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// For debugging in production
console.log("API URL being used:", BACKEND_URL);

export default BACKEND_URL;
