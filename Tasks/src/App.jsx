import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Auth/AuthContext.jsx";
import { DarkModeProvider } from "./contexts/DarkModeContext.jsx";
import { TimeTrackerProvider } from "./contexts/TimeTrackerContext.jsx";
import "./index.css";

import LoginForm from "./Auth/LoginForm.jsx";
import SignupForm from "./Auth/SignupForm.jsx";
import Profile from "./Auth/Profile.jsx";

import Tasks from "./ToDoList/tasks.jsx";
import Notes from "./Notes/Notes.jsx";
import Tracker from "./Tracker/Tracker.jsx";
import Dashboard from "./Dashboard/Dashboard.jsx";

import Navbar from "./Components/Navbar.jsx";

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <TimeTrackerProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<LoginForm />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </BrowserRouter>
        </TimeTrackerProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
