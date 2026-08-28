import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import Library from "./pages/Library";
import PaperAnalysis from "./pages/PaperAnalysis";
import ProjectDetails from "./pages/ProjectDetails";
import Home from "./pages/Home";


// ============================================================
// AUTH
// ============================================================

const isAuthenticated =
  () => {

    return Boolean(
      localStorage.getItem(
        "access_token"
      )
    );

  };


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({
  children,
}) {

  const location =
    useLocation();


  if (
    !isAuthenticated()
  ) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );

  }


  return children;

}


// ============================================================
// PUBLIC ROUTE
// ============================================================

function PublicRoute({
  children,
}) {

  if (
    isAuthenticated()
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return children;

}


// ============================================================
// APP
// ============================================================

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* LANDING */}

        <Route
          path="/"
          element={
            <Home />
          }
        />


        {/* LOGIN */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />


        {/* REGISTER */}

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* CREATE PROJECT */}

        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />


        {/* PROJECT WORKSPACE */}

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />


        {/* LIBRARY */}

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />


        {/* PAPER ANALYSIS */}

        <Route
          path="/paper-analysis"
          element={
            <ProtectedRoute>
              <PaperAnalysis />
            </ProtectedRoute>
          }
        />


        {/* OLD FIND PAPERS URL */}

        <Route
          path="/find-papers"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* UNKNOWN */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;