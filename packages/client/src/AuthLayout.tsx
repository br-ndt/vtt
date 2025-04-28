import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AccountForm from "./AccountForm";
import { SocketProvider } from "./SocketContext";

function AuthLayout() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  ) : (
    <AccountForm />
  );
}

export default AuthLayout;
