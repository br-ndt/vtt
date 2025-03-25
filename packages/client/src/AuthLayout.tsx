import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import { SocketProvider } from "./SocketContext";

function AuthLayout() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  ) : (
    <LoginForm />
  );
}

export default AuthLayout;
