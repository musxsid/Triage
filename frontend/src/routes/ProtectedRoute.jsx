import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (queryToken) {
    localStorage.setItem("token", queryToken);
    const queryUsername = params.get("username");
    if (queryUsername) {
      localStorage.setItem("username", queryUsername);
      localStorage.setItem("user", JSON.stringify({
        username: queryUsername,
        email: `${queryUsername}@triage.io`,
        firstName: queryUsername
      }));
    }
  }

  const token = localStorage.getItem("token");

  // If no token → block access
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;