import { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch tasks when component mounts
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/tasks`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        setError("Failed to fetch tasks");
      }
    } catch (err) {
      setError("Failed to fetch tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setInputValue(task.title);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setInputValue("");
  };

  const addTask = async () => {
    if (!inputValue.trim()) return;

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: inputValue.trim() }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([newTask, ...tasks]); // Add to front of list
        setInputValue(""); // Clear input
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add task");
      }
    } catch (err) {
      setError("Failed to add task");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const editTask = async (taskId) => {
    if (!inputValue.trim()) return;

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: inputValue.trim() }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(
          tasks.map((task) => (task.id === taskId ? updatedTask : task))
        );
        setEditingTaskId(null); // Exit edit mode
        setInputValue(""); // Clear input
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to edit task");
      }
    } catch (err) {
      setError("Failed to edit task");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId, currentCompleted) => {
    try {
      const response = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ completed: !currentCompleted }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(
          tasks.map((task) => (task.id === taskId ? updatedTask : task))
        );
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (editingTaskId) {
        editTask(editingTaskId);
      } else {
        addTask();
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          {!user ? (
            // Not logged in - show login prompt
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please log in to access your tasks.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
              >
                Go to Login
              </button>
            </div>
          ) : (
            // Logged in - show tasks interface
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">
                  TaskFlow
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Welcome back, {user.username}!
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}

              {/* Add/Edit Task Section */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {editingTaskId ? "Edit Task" : "Add New Task"}
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder={
                      editingTaskId
                        ? "Update task..."
                        : "What needs to be done?"
                    }
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                  {editingTaskId ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(editingTaskId)}
                        disabled={loading || !inputValue.trim()}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {loading ? "Updating..." : "Update"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={addTask}
                      disabled={loading || !inputValue.trim()}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {loading ? "Adding..." : "Add Task"}
                    </button>
                  )}
                </div>
              </div>

              {/* Tasks Display */}
              <div>
                {loading && tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading tasks...
                  </div>
                ) : tasks.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                        Your Tasks
                      </h2>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {tasks.filter((task) => !task.completed).length} active,{" "}
                        {tasks.length} total
                      </span>
                    </div>
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            task.completed
                              ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                              : "bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.completed || false}
                              onChange={() =>
                                toggleTask(task.id, task.completed)
                              }
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 rounded"
                            />
                            <span
                              className={`flex-1 truncate ${
                                task.completed
                                  ? "line-through text-gray-500 dark:text-gray-400"
                                  : "text-gray-900 dark:text-white"
                              }`}
                              title={task.title}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(task)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={task.completed}
                              title={
                                task.completed
                                  ? "Can't edit completed tasks"
                                  : "Edit task"
                              }
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition flex-shrink-0"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      No tasks yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Add your first task above to get started!
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
