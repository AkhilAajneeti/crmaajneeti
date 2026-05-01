import { Navigate } from "react-router-dom";
import { canEntity, canGlobal } from "utils/permissions";

const ProtectedRoute = ({ children, entity, action = "read", permission }) => {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (entity && !canEntity(entity, action)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !canGlobal(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
