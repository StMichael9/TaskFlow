import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import BACKEND_URL from "../utils/apiConfig";

const API_URL = BACKEND_URL;

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trackers, setTrackers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTracker, setNewTracker] = useState({
    title: "",
    targetDuration: "",
    timeUnit: "minutes", // Added timeUnit field (minutes/hours)
    weeklyGoal: "", // Added weekly goal field
    weeklyGoalUnit: "minutes", // Added weekly goal unit field
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [error, setError] = useState("");
  const [elapsedTimes, setElapsedTimes] = useState({});
  const intervalRef = useRef(null);
  const [editTrackerId, setEditTrackerId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    targetDuration: "",
    weeklyGoal: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTrackers();
  }, [user, navigate]);

  const fetchTrackers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/tracker`, {
        credentials: "include", // Important for sending cookies with request
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTrackers(data);
      setError("");
    } catch (error) {
      console.error("Error fetching trackers:", error);
      setError("Failed to load trackers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createTracker = async (e) => {
    e.preventDefault();
    try {
      if (!newTracker.title.trim()) {
        setError("Please enter a title for your tracker");
        return;
      }

      // Convert target duration based on the selected time unit
      let targetDurationInSeconds = null;
      if (newTracker.targetDuration) {
        const durationValue = parseInt(newTracker.targetDuration);
        if (newTracker.timeUnit === "hours") {
          targetDurationInSeconds = durationValue * 3600; // Convert hours to seconds
        } else {
          targetDurationInSeconds = durationValue * 60; // Convert minutes to seconds
        }
      }

      // Convert weekly goal based on the selected time unit
      let weeklyGoalInSeconds = null;
      if (newTracker.weeklyGoal) {
        const goalValue = parseInt(newTracker.weeklyGoal);
        if (newTracker.weeklyGoalUnit === "hours") {
          weeklyGoalInSeconds = goalValue * 3600; // Convert hours to seconds
        } else {
          weeklyGoalInSeconds = goalValue * 60; // Convert minutes to seconds
        }
      }

      const response = await fetch(`${API_URL}/api/tracker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newTracker.title,
          targetDuration: targetDurationInSeconds,
          weeklyGoal: weeklyGoalInSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTrackerData = await response.json();
      setTrackers([...trackers, newTrackerData]);
      setNewTracker({
        title: "",
        targetDuration: "",
        timeUnit: "minutes",
        weeklyGoal: "",
        weeklyGoalUnit: "minutes",
      });
      setIsFormVisible(false);
      setError("");
    } catch (error) {
      console.error("Error creating tracker:", error);
      setError("Failed to create tracker. Please try again.");
    }
  };

  const toggleTracker = async (tracker) => {
    try {
      const endpoint = tracker.isRunning
        ? `${API_URL}/api/tracker/${tracker.id}/stop`
        : `${API_URL}/api/tracker/${tracker.id}/start`;

      const response = await fetch(endpoint, {
        method: "PATCH", // Try using PATCH again since we've updated CORS
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTracker = await response.json();

      // Update the trackers list with the updated tracker
      setTrackers(
        trackers.map((t) => (t.id === updatedTracker.id ? updatedTracker : t))
      );
      setError("");
    } catch (error) {
      console.error(
        `Error ${tracker.isRunning ? "stopping" : "starting"} tracker:`,
        error
      );
      setError(
        `Failed to ${
          tracker.isRunning ? "stop" : "start"
        } tracker. Please try again.`
      );
    }
  };

  // Live elapsed time for running trackers
  useEffect(() => {
    function updateElapsed() {
      const now = Date.now();
      const newElapsed = {};
      trackers.forEach((tracker) => {
        if (tracker.isRunning && tracker.startTime) {
          const started =
            typeof tracker.startTime === "string"
              ? Date.parse(tracker.startTime)
              : tracker.startTime;
          const base = tracker.totalTime || 0;
          const startedMs = started < 1e12 ? started * 1000 : started;
          const elapsed = base + Math.floor((now - startedMs) / 1000);
          newElapsed[tracker.id] = elapsed;
        } else {
          newElapsed[tracker.id] = tracker.totalTime || 0;
        }
      });
      setElapsedTimes(newElapsed);
    }
    updateElapsed();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateElapsed, 1000);
    return () => clearInterval(intervalRef.current);
  }, [trackers]);

  // Edit tracker modal logic
  const openEditModal = (tracker) => {
    setEditTrackerId(tracker.id);
    setEditForm({
      title: tracker.title,
      targetDuration: tracker.targetDuration || "",
      weeklyGoal: tracker.weeklyGoal || "",
    });
  };
  const closeEditModal = () => {
    setEditTrackerId(null);
    setEditForm({ title: "", targetDuration: "", weeklyGoal: "" });
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/tracker/${editTrackerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editForm.title,
          targetDuration: parseInt(editForm.targetDuration),
          weeklyGoal: parseInt(editForm.weeklyGoal),
        }),
      });
      if (!res.ok) throw new Error("Failed to update tracker");
      closeEditModal();
      fetchTrackers();
    } catch (err) {
      setError("Failed to update tracker");
    }
  };

  // Delete tracker
  const deleteTracker = async (trackerId) => {
    if (!window.confirm("Delete this tracker?")) return;
    try {
      const res = await fetch(`${API_URL}/api/tracker/${trackerId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete tracker");
      fetchTrackers();
    } catch (err) {
      setError("Failed to delete tracker");
    }
  };

  // Format seconds into a readable time format (HH:MM:SS)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">
        ⏱️ Time Tracker
      </h1>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add New Tracker Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {isFormVisible ? "Cancel" : "Add New Tracker"}
        </button>
      </div>

      {/* New Tracker Form */}
      {isFormVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Create New Tracker
          </h2>
          <form onSubmit={createTracker} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTracker.title}
                onChange={(e) =>
                  setNewTracker({ ...newTracker, title: e.target.value })
                }
                placeholder="E.g., Coding, Reading, Exercise..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Duration
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newTracker.targetDuration}
                  onChange={(e) =>
                    setNewTracker({
                      ...newTracker,
                      targetDuration: e.target.value,
                    })
                  }
                  placeholder="E.g., 30"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={newTracker.timeUnit}
                  onChange={(e) =>
                    setNewTracker({
                      ...newTracker,
                      timeUnit: e.target.value,
                    })
                  }
                  className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weekly Goal
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newTracker.weeklyGoal}
                  onChange={(e) =>
                    setNewTracker({
                      ...newTracker,
                      weeklyGoal: e.target.value,
                    })
                  }
                  placeholder="E.g., 120"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={newTracker.weeklyGoalUnit}
                  onChange={(e) =>
                    setNewTracker({
                      ...newTracker,
                      weeklyGoalUnit: e.target.value,
                    })
                  }
                  className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Tracker
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your trackers...
          </p>
        </div>
      ) : trackers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No trackers yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first time tracker to get started!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence>
            {trackers.map((tracker) => (
              <motion.li
                key={tracker.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-2xl hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-lg text-gray-800 dark:text-white">
                    {tracker.title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTracker(tracker)}
                      className={`px-4 py-2 rounded-xl text-white transition ${
                        tracker.isRunning
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {tracker.isRunning ? "Stop" : "Start"}
                    </button>
                    <button
                      onClick={() => openEditModal(tracker)}
                      className="px-2 py-1 rounded bg-blue-500 text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTracker(tracker.id)}
                      className="px-2 py-1 rounded bg-gray-500 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total time:{" "}
                      <span className="font-medium">
                        {formatTime(elapsedTimes[tracker.id])}
                      </span>
                      {tracker.targetDuration && (
                        <span className="ml-2">
                          / Target: {formatTime(tracker.targetDuration)}
                        </span>
                      )}
                    </p>
                    {tracker.isRunning && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                        Started at:{" "}
                        {new Date(tracker.startTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Weekly goal display if available */}
                  {tracker.weeklyGoal && (
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Weekly Goal: {formatTime(tracker.weeklyGoal)}
                      </span>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (elapsedTimes[tracker.id] / tracker.weeklyGoal) *
                                100
                            )}%`,
                            backgroundColor:
                              elapsedTimes[tracker.id] >= tracker.weeklyGoal
                                ? "#10B981"
                                : "#3B82F6",
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {tracker.targetDuration && (
                    <div className="w-16 h-16 relative">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                          strokeDasharray="100, 100"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={
                            tracker.totalTime >= tracker.targetDuration
                              ? "#10B981"
                              : "#3B82F6"
                          }
                          strokeWidth="3"
                          strokeDasharray={`${Math.min(
                            100,
                            (tracker.totalTime / tracker.targetDuration) * 100
                          )}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                        {Math.min(
                          100,
                          Math.round(
                            (tracker.totalTime / tracker.targetDuration) * 100
                          )
                        )}
                        %
                      </div>
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Edit Modal */}
      {editTrackerId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={submitEdit}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Edit Tracker</h2>
            <div className="mb-3">
              <label className="block mb-1">Title</label>
              <input
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1">Target Duration (seconds)</label>
              <input
                name="targetDuration"
                type="number"
                value={editForm.targetDuration}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1">Weekly Goal (seconds)</label>
              <input
                name="weeklyGoal"
                type="number"
                value={editForm.weeklyGoal}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Tracker;
