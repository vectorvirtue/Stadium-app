import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";

// The access token itself lives in an httpOnly cookie now (see
// lib/api.js), which JS can't read — that's the point. "user" in
// localStorage is just a UI convenience so we know who's "probably"
// logged in without an extra round trip; it carries no auth weight of
// its own. The real gate is server-side: every protected endpoint
// checks the cookie via get_current_user, so a stale/forged "user"
// entry here just means an API call 401s and the user gets bounced,
// same as before this change.
function ProtectedAdmin() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/dashboard" replace />;
}

function ProtectedDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user ? <Dashboard /> : <Navigate to="/" replace />;
}

export default function App() {
  return <HelmetProvider><BrowserRouter><Routes>
    <Route path="/" element={<SignIn />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/dashboard" element={<ProtectedDashboard />} />
    <Route path="/admin" element={<ProtectedAdmin />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></HelmetProvider>;
}
