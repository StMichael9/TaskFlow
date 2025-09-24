// src/Auth/Profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import BACKEND_URL from "../utils/apiConfig";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    tasks: 0,
    completedTasks: 0,
    notes: 0,
    trackers: 0,
    totalTimeLogged: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchUserStats();
  }, [user, navigate]);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      const API = BACKEND_URL;

      // Get tasks stats
      const tasksRes = await fetch(`${API}/api/tasks`, {
        credentials: "include",
      });

      // Get trackers stats
      const trackersRes = await fetch(`${API}/api/tracker`, {
        credentials: "include",
      });

      // Get notes stats (if you have a notes API)
      const notesRes = await fetch(`${API}/api/notes`, {
        credentials: "include",
      }).catch(() => ({ ok: false })); // Graceful handling if notes API doesn't exist

      if (!tasksRes.ok || !trackersRes.ok) {
        throw new Error("Failed to fetch user data");
      }

      const tasks = await tasksRes.json();
      const trackers = await trackersRes.json();
      const notes = notesRes.ok ? await notesRes.json() : [];

      const completedTasks = tasks.filter((task) => task.completed).length;
      const totalTimeLogged = trackers.reduce(
        (total, tracker) => total + (tracker.totalTime || 0),
        0
      );

      setUserStats({
        tasks: tasks.length,
        completedTasks,
        notes: notes.length,
        trackers: trackers.length,
        totalTimeLogged,
      });
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError("Failed to load your profile data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      navigate("/login");
    } catch (err) {
      setError("Failed to logout. Please try again.");
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (!user) {
    return null; // Handled by the navigate in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={fetchUserStats} className="ml-2 text-sm underline">
              Try again
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-6 md:p-8 text-center md:text-left md:flex items-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto md:mx-0 md:mr-6">
              {user.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 md:mt-0">
                {user.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {user.email}
              </p>
              <div className="mt-4">
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="py-2 px-6 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Log Out"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Your Activity
        </h2>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Tasks
                </h3>
                <span className="text-blue-600 dark:text-blue-400">
                  {userStats.completedTasks}/{userStats.tasks}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: userStats.tasks
                        ? `${
                            (userStats.completedTasks / userStats.tasks) * 100
                          }%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {userStats.completedTasks} completed out of {userStats.tasks}{" "}
                tasks
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Time Tracked
                </h3>
                <span className="text-purple-600 dark:text-purple-400">
                  {formatTime(userStats.totalTimeLogged)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {userStats.trackers} active trackers
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Notes
                </h3>
                <span className="text-yellow-600 dark:text-yellow-400">
                  {userStats.notes}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Total notes created
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
