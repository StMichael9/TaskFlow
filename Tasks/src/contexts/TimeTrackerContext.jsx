import { createContext, useContext, useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const TimeTrackerContext = createContext();

export const useTimeTracker = () => useContext(TimeTrackerContext);

export const TimeTrackerProvider = ({ children }) => {
  const [trackers, setTrackers] = useState([]);
  const [activeTracker, setActiveTracker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchTrackers();
    // Restore active tracker from localStorage
    const activeId = localStorage.getItem("activeTrackerId");
    if (activeId) {
      setActiveTracker(trackers.find((t) => t.id === activeId));
    }
  }, []);

  useEffect(() => {
    if (activeTracker) {
      localStorage.setItem("activeTrackerId", activeTracker.id);
      startInterval();
    } else {
      localStorage.removeItem("activeTrackerId");
      stopInterval();
    }
    return stopInterval;
  }, [activeTracker]);

  const fetchTrackers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tracker`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trackers");
      const data = await res.json();
      setTrackers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTracker = async (trackerId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/tracker/${trackerId}/start`, {
        method: "PATCH",
        credentials: "include",
      });

      if (response.ok) {
        const updatedTracker = await response.json();
        // Add displayTime property to track real-time updates
        updatedTracker.displayTime = updatedTracker.totalTime;

        setTrackers((prev) =>
          prev.map((t) => (t.id === updatedTracker.id ? updatedTracker : t))
        );
        setActiveTracker(updatedTracker);
      } else {
        throw new Error("Failed to start tracker");
      }
    } catch (err) {
      setError("Failed to start tracker");
    } finally {
      setLoading(false);
    }
  };

  const stopTracker = async (trackerId) => {
    setLoading(true);
    try {
      // First check if the tracker exists and is running
      const tracker = trackers.find((t) => t.id === trackerId);
      if (!tracker || !tracker.isRunning) {
        setLoading(false);
        return; // Silently fail rather than throwing a 400 error
      }

      const response = await fetch(`${API}/api/tracker/${trackerId}/stop`, {
        method: "PATCH",
        credentials: "include",
      });

      if (response.ok) {
        const updatedTracker = await response.json();
        // Reset displayTime when stopping a tracker
        updatedTracker.displayTime = updatedTracker.totalTime;

        setTrackers((prev) =>
          prev.map((t) => (t.id === updatedTracker.id ? updatedTracker : t))
        );
        setActiveTracker(null);
      } else {
        throw new Error("Failed to stop tracker");
      }
    } catch (err) {
      setError("Failed to stop tracker");
    } finally {
      setLoading(false);
    }
  };

  const startInterval = () => {
    if (intervalRef.current) return;

    // Create a counter that updates every second for the UI
    intervalRef.current = setInterval(() => {
      // Update the UI every second for a smooth timer display
      if (activeTracker && activeTracker.isRunning) {
        setTrackers((prevTrackers) =>
          prevTrackers.map((tracker) => {
            if (tracker.id === activeTracker.id && tracker.isRunning) {
              // For UI display only, increment totalTime by 1 second
              return {
                ...tracker,
                displayTime:
                  (tracker.displayTime || tracker.totalTime || 0) + 1,
              };
            }
            return tracker;
          })
        );
      }

      // Only sync with the backend every minute to reduce server load
      const now = new Date();
      if (now.getSeconds() === 0) {
        syncTracker();
      }
    }, 1000); // Update every second for smooth UI
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const syncTracker = async () => {
    if (!activeTracker) return;

    // Only sync if the tracker is actually running
    if (!activeTracker.isRunning) return;

    try {
      const response = await fetch(
        `${API}/api/tracker/${activeTracker.id}/sync`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        const updatedTracker = await response.json();
        // Save the current displayTime so we don't lose our visual counting
        const currentDisplayTime =
          trackers.find((t) => t.id === updatedTracker.id)?.displayTime || 0;

        // If the backend has a larger totalTime, use that as our new baseline
        const newDisplayTime = Math.max(
          currentDisplayTime,
          updatedTracker.totalTime
        );
        updatedTracker.displayTime = newDisplayTime;

        setTrackers((prev) =>
          prev.map((t) => (t.id === updatedTracker.id ? updatedTracker : t))
        );
      }
    } catch (err) {
      // Silently handle sync errors
      console.log("Sync error:", err);
    }
  };

  const getElapsedTime = (tracker) => {
    if (!tracker) return 0;

    // If we have a displayTime (real-time counter), use that
    if (tracker.displayTime !== undefined) {
      return tracker.displayTime;
    }

    // If the tracker is running, calculate elapsed time including time since start
    if (tracker.isRunning && tracker.startTime) {
      const startTime = new Date(tracker.startTime);
      const now = new Date();
      const elapsedSinceStart = Math.floor((now - startTime) / 1000);
      return (tracker.totalTime || 0) + elapsedSinceStart;
    }

    // Otherwise, just return the stored totalTime
    return tracker.totalTime || 0;
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <TimeTrackerContext.Provider
      value={{
        trackers,
        activeTracker,
        startTracker,
        stopTracker,
        loading,
        error,
        getElapsedTime,
        formatTime,
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  );
};
