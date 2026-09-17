import { Navigate, useLocation } from "react-router-dom";
import { hasPermission } from "../../utils/permissions.js";
import { useAuth } from "./AuthContext.jsx";

export default function PermissionRoute({ permission, children }) {
  const { auth } = useAuth();
  const location = useLocation();
  const permissionValue = auth?.userInfo?.DESCRIPTION || "";

  if (!hasPermission(permissionValue, permission)) {
    return (
      <Navigate
        to="/403"
        replace
        state={{ attemptedPath: location.pathname }}
      />
    );
  }

  return children;
}
