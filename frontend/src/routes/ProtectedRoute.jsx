import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (queryToken) {
    localStorage.setItem("token", queryToken);
    const queryUsername = params.get("username");
    const queryName = params.get("name");
    const queryEmail = params.get("email");
    const queryPicture = params.get("picture");

    if (queryUsername) {
      localStorage.setItem("username", queryUsername);
      const userData = {
        username: queryUsername,
        name: queryName || queryUsername,
        email: queryEmail || `${queryUsername}@triage.io`,
        firstName: queryName ? queryName.split(" ")[0] : queryUsername,
        lastName: queryName && queryName.includes(" ") ? queryName.substring(queryName.indexOf(" ") + 1) : "",
        profilePicture: queryPicture || null
      };
      localStorage.setItem("user", JSON.stringify(userData));

      if (queryPicture || queryName) {
        fetch("http://localhost:8080/api/auth/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${queryToken}`
          },
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profilePicture: userData.profilePicture
          })
        }).catch(() => {});
      }
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem("token");

  // If no token → block access
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;