import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { useTimeTracker } from "../contexts/TimeTrackerContext";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const {
    trackers,
    activeTracker,
    startTracker,
    stopTracker,
    loading: trackerLoading,
    error: trackerError,
    getElapsedTime,
    formatTime,
  } = useTimeTracker();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksRemaining: 0,
    trackerProgress: 0,
    timeLogged: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (tasks.length > 0 && trackers.length > 0) {
      calculateStats(tasks, trackers);
    }
  }, [tasks, trackers]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const tasksResponse = await fetch(`${API}/api/tasks`, {
        credentials: "include",
      });
      if (!tasksResponse.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      calculateStats(tasksData, trackers);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasksData, trackersData) => {
    const completed = tasksData.filter((task) => task.completed).length;
    const remaining = tasksData.length - completed;
    const totalTimeLogged = trackersData.reduce(
      (total, tracker) => total + getElapsedTime(tracker),
      0
    );
    const totalGoals = trackersData.reduce(
      (sum, tracker) => sum + (tracker.weeklyGoal || 0),
      0
    );
    const totalProgress =
      totalGoals > 0
        ? Math.min(100, Math.round((totalTimeLogged / totalGoals) * 100))
        : 0;
    setStats({
      tasksCompleted: completed,
      tasksRemaining: remaining,
      trackerProgress: totalProgress,
      timeLogged: totalTimeLogged,
    });
  };

  const toggleTracker = async (trackerId) => {
    try {
      const isActive = activeTracker?.id === trackerId;
      if (isActive) {
        await stopTracker(trackerId);
      } else {
        if (activeTracker) await stopTracker(activeTracker.id);
        await startTracker(trackerId);
      }
    } catch (err) {
      setError("Failed to toggle tracker");
    }
  };

  // Display loading state
  if (loading && !tasks.length && !trackers.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-blue-400">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {user?.username || "User"}!
            </p>
          </div>
          {/* Removed profile and login/logout buttons, navbar handles navigation */}
        </header>

        {/* Error display */}
        {error && (
          <div className="p-4 mb-6 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
            <p>{error}</p>
            <button
              className="text-sm underline mt-1"
              onClick={() => {
                setError("");
                fetchDashboardData();
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Tasks completed */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Tasks Completed
                </p>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {stats.tasksCompleted}
                </h2>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate("/tasks")}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                View all tasks →
              </button>
            </div>
          </div>

          {/* Tasks remaining */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Tasks Remaining
                </p>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {stats.tasksRemaining}
                </h2>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate("/tasks")}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Add a new task →
              </button>
            </div>
          </div>

          {/* Time logged */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Time Logged
                </p>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {formatTime(stats.timeLogged)}
                </h2>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate("/tracker")}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Manage time tracking →
              </button>
            </div>
          </div>

          {/* Weekly progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Weekly Goal Progress
                </p>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {stats.trackerProgress}%
                </h2>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-yellow-600 dark:bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${stats.trackerProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent tasks */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Recent Tasks
              </h2>
              <button
                onClick={() => navigate("/tasks")}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                View all
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="mx-auto h-12 w-12 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p>No tasks found</p>
                <button
                  onClick={() => navigate("/tasks")}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.slice(0, 5).map((task) => (
                    <li key={task.id} className="py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          readOnly
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 rounded"
                        />
                        <span
                          className={`${
                            task.completed
                              ? "line-through text-gray-500 dark:text-gray-400"
                              : "text-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Active trackers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Time Trackers
              </h2>
              <button
                onClick={() => navigate("/tracker")}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Manage
              </button>
            </div>

            {trackers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="mx-auto h-12 w-12 mb-3"
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
                <p>No trackers found</p>
                <button
                  onClick={() => navigate("/tracker")}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Set up time tracking
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {trackers.map((tracker) => {
                  return (
                    <div
                      key={tracker.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl shadow flex flex-col gap-2"
                    >
                      <div className="font-semibold text-lg text-gray-800 dark:text-white">
                        {tracker.title}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Total time: {formatTime(tracker.totalTime)}
                        {tracker.targetDuration && (
                          <span className="ml-2">
                            / Target: {formatTime(tracker.targetDuration)}
                          </span>
                        )}
                      </div>
                      {tracker.weeklyGoal && (
                        <div className="text-sm">
                          Weekly Goal: {formatTime(tracker.weeklyGoal)}
                          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (tracker.totalTime / tracker.weeklyGoal) * 100
                                )}%`,
                                backgroundColor:
                                  tracker.totalTime >= tracker.weeklyGoal
                                    ? "#10B981"
                                    : "#3B82F6",
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <button
            onClick={() => navigate("/tasks")}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 p-4 rounded-xl shadow-md transition flex items-center justify-center gap-3"
          >
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">
              Manage Tasks
            </span>
          </button>

          <button
            onClick={() => navigate("/tracker")}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 p-4 rounded-xl shadow-md transition flex items-center justify-center gap-3"
          >
            <svg
              className="h-6 w-6 text-purple-600 dark:text-purple-400"
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
            <span className="font-medium text-gray-900 dark:text-white">
              Track Time
            </span>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 p-4 rounded-xl shadow-md transition flex items-center justify-center gap-3"
          >
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">
              Your Profile
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
