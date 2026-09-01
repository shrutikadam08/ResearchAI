import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FindPapers from "./pages/FindPapers";
import Library from "./pages/Library";
import CreateProject from "./pages/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";
import PaperAnalysis from "./pages/PaperAnalysis";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* AUTHENTICATION */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* MAIN PAGES */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/find-papers"
          element={<FindPapers />}
        />

        <Route
          path="/library"
          element={<Library />}
        />

        {/* CREATE PROJECT */}
        <Route
          path="/projects/new"
          element={<CreateProject />}
        />

        {/* PROJECT DETAILS */}
        <Route
          path="/projects/:projectId"
          element={<ProjectDetails />}
        />

        {/* PAPER ANALYSIS */}
        <Route
          path="/paper-analysis"
          element={<PaperAnalysis />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Home />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;