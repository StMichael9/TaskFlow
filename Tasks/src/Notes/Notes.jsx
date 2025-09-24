import React, { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

const Notes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Separate state for regular notes and sticky notes
  const [notes, setNotes] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stickySearchTerm, setStickySearchTerm] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "sticky"

  // Form state for new/editing notes
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    category: "General",
  });

  // Form state for sticky notes
  const [stickyNoteForm, setStickyNoteForm] = useState({
    title: "",
    content: "",
    category: "General",
  });

  const categories = ["General", "Work", "Personal", "Ideas", "Archive"];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchNotes();
    fetchStickyNotes();
  }, [user, navigate]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API}/api/notes?type=regular`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        if (data.length > 0 && !selectedNote) {
          setSelectedNote(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStickyNotes = async () => {
    try {
      const response = await fetch(`${API}/api/notes?type=sticky`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStickyNotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch sticky notes:", err);
    }
  };

  const createNote = async () => {
    // Use "Untitled Note" if no title is provided
    const noteTitle = noteForm.title.trim() || "Untitled Note";

    try {
      const response = await fetch(`${API}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...noteForm,
          title: noteTitle,
          type: "regular",
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
        setNoteForm({ title: "", content: "", category: "General" });
        setIsCreating(false);
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const createStickyNote = async () => {
    // Use "Untitled Sticky Note" if no title is provided
    const noteTitle = stickyNoteForm.title.trim() || "Untitled Sticky Note";

    try {
      const response = await fetch(`${API}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...stickyNoteForm,
          title: noteTitle,
          type: "sticky",
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setStickyNotes([newNote, ...stickyNotes]);
        setStickyNoteForm({ title: "", content: "", category: "General" });
        setIsCreating(false);
      }
    } catch (err) {
      console.error("Failed to create sticky note:", err);
    }
  };

  const updateNote = async (noteId, updates) => {
    try {
      const response = await fetch(`${API}/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(
          notes.map((note) => (note.id === noteId ? updatedNote : note))
        );
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(updatedNote);
        }
      }
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  const updateStickyNote = async (noteId, updates) => {
    try {
      const response = await fetch(`${API}/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setStickyNotes(
          stickyNotes.map((note) => (note.id === noteId ? updatedNote : note))
        );
      }
    } catch (err) {
      console.error("Failed to update sticky note:", err);
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`${API}/api/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const newNotes = notes.filter((note) => note.id !== noteId);
        setNotes(newNotes);
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(newNotes.length > 0 ? newNotes[0] : null);
        }
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const deleteStickyNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this sticky note?"))
      return;

    try {
      const response = await fetch(`${API}/api/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const newStickyNotes = stickyNotes.filter((note) => note.id !== noteId);
        setStickyNotes(newStickyNotes);
      }
    } catch (err) {
      console.error("Failed to delete sticky note:", err);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStickyNotes = stickyNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(stickySearchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(stickySearchTerm.toLowerCase()) ||
      note.category.toLowerCase().includes(stickySearchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  // Create Note Modal Component (extracted to prevent re-rendering issues)
  const CreateNoteModal = ({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
    categories,
    isSticky = false,
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isSticky ? "Create New Sticky Note" : "Create New Note"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={
                  isSticky
                    ? "Sticky note title (leave empty for 'Untitled Sticky Note')..."
                    : "Note title (leave empty for 'Untitled Note')..."
                }
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="flex-1 px-4 py-3 text-lg font-semibold border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              placeholder={
                isSticky
                  ? "Start writing your sticky note..."
                  : "Start writing your note..."
              }
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {isSticky ? "Save Sticky Note" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sticky Notes Component
  const StickyNotesView = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              Notes
            </h1>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-2 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                List View
              </button>
              <button
                onClick={() => setViewMode("sticky")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "sticky"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-2 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-4H5m14 8H5m14 4H5"
                  />
                </svg>
                Sticky Notes
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search sticky notes..."
                value={stickySearchTerm}
                onChange={(e) => setStickySearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <button
              onClick={() => setIsCreating(true)}
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
              New Note
            </button>
          </div>
        </div>

        {/* Sticky Notes Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading notes...
          </div>
        ) : filteredStickyNotes.length === 0 ? (
          <div className="text-center py-12">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {stickySearchTerm
                ? "No sticky notes found"
                : "No sticky notes yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {stickySearchTerm
                ? "Try adjusting your search terms"
                : "Create your first sticky note to get started!"}
            </p>
            {!stickySearchTerm && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create First Sticky Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStickyNotes.map((note) => (
              <div
                key={note.id}
                className={`sticky-note relative p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-rotate-1 ${
                  note.category === "Work"
                    ? "bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500"
                    : note.category === "Personal"
                    ? "bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500"
                    : note.category === "Ideas"
                    ? "bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500"
                    : note.category === "Archive"
                    ? "bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-500"
                    : "bg-blue-100 dark:bg-blue-900/20 border-l-4 border-blue-500"
                }`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStickyNote(note.id);
                  }}
                  className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition opacity-0 group-hover:opacity-100"
                  title="Delete Sticky Note"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Category badge */}
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      note.category === "Work"
                        ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                        : note.category === "Personal"
                        ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                        : note.category === "Ideas"
                        ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
                        : note.category === "Archive"
                        ? "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                        : "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {note.category}
                  </span>
                </div>

                {/* Note title */}
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
                  {note.title}
                </h3>

                {/* Note content preview */}
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 mb-3 min-h-[5rem]">
                  {note.content || "No content..."}
                </p>

                {/* Date */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(note.updatedAt)}
                </p>

                {/* Decorative corner fold */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[15px] border-b-[15px] border-l-transparent border-b-white/20"></div>
              </div>
            ))}
          </div>
        )}

        {/* Create Note Modal for Sticky View */}
        <CreateNoteModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSave={createStickyNote}
          formData={stickyNoteForm}
          setFormData={setStickyNoteForm}
          categories={categories}
          isSticky={true}
        />
      </div>
    </div>
  );

  // Render based on view mode
  if (viewMode === "sticky") {
    return <StickyNotesView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                Notes
              </h1>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                    title="List View"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("sticky")}
                    className={`p-2 rounded-md transition ${
                      viewMode === "sticky"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                    title="Sticky Notes View"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14-4H5m14 8H5m14 4H5"
                      />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setIsCreating(true)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="New Note"
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
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No notes found"
                  : "No notes yet. Create your first note!"}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${
                    selectedNote && selectedNote.id === note.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                      {note.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        note.category === "Work"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : note.category === "Personal"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : note.category === "Ideas"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : note.category === "Archive"
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                    >
                      {note.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {note.content.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(note.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {isCreating ? (
            /* Create Note Form */
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Note
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNote}
                      disabled={!noteForm.title.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Save Note
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Note title..."
                      value={noteForm.title}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, title: e.target.value })
                      }
                      className="flex-1 px-4 py-3 text-xl font-semibold border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={noteForm.category}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, category: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    placeholder="Start writing your note..."
                    value={noteForm.content}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, content: e.target.value })
                    }
                    className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          ) : selectedNote ? (
            /* View/Edit Selected Note */
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    {editingTitle ? (
                      <input
                        type="text"
                        value={selectedNote.title}
                        onChange={(e) =>
                          setSelectedNote({
                            ...selectedNote,
                            title: e.target.value,
                          })
                        }
                        onBlur={() => {
                          setEditingTitle(false);
                          updateNote(selectedNote.id, {
                            title: selectedNote.title,
                          });
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            setEditingTitle(false);
                            updateNote(selectedNote.id, {
                              title: selectedNote.title,
                            });
                          }
                        }}
                        className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 text-gray-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <h2
                        onClick={() => setEditingTitle(true)}
                        className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {selectedNote.title}
                      </h2>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Last updated: {formatDate(selectedNote.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedNote.category}
                      onChange={(e) =>
                        updateNote(selectedNote.id, {
                          category: e.target.value,
                        })
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Delete Note"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <textarea
                  value={selectedNote.content}
                  onChange={(e) =>
                    setSelectedNote({
                      ...selectedNote,
                      content: e.target.value,
                    })
                  }
                  onBlur={() =>
                    updateNote(selectedNote.id, {
                      content: selectedNote.content,
                    })
                  }
                  placeholder="Start writing your note..."
                  className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No note selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Select a note from the sidebar or create a new one to get
                  started.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
