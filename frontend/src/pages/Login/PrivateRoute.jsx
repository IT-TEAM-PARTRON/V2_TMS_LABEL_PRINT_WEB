// src/components/PrivateRoute.jsx // hàm xử lý route riêng tư bắt login mới cho truy cập route
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function PrivateRoute({ children }) {
  const { auth } = useAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
