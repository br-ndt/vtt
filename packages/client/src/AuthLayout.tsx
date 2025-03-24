import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";

function AuthLayout() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Outlet /> : <LoginForm />;
}

export default AuthLayout;
