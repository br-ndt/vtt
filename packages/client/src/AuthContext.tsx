import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

// Define the type of user
interface User {
  username: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component to provide the context
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if the user is logged in when the app starts
    const checkAuth = async () => {
      const response = await fetch("/auth/current", {
        credentials: "same-origin",
      });
      if (response.ok) {
        const user = await response.json();
        setUser(user);
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "same-origin",
    });

    if (response.ok) {
      const loggedInUser = await response.json();
      setUser(loggedInUser);
      setIsAuthenticated(true);
    } else {
      throw new Error("login failed");
    }
  };

  const logout = async () => {
    await fetch("/auth/logout", {
      method: "GET",
      credentials: "same-origin",
    });
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
