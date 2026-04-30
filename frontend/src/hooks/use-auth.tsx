import { createContext, useContext, useState, ReactNode, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/api";

interface User {
  _id: string;
  name?: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    if (isBrowser) {
      try {
        const storedToken = localStorage.getItem("adminToken");
        const storedUser = localStorage.getItem("adminData");

        if (storedToken) {
          setToken(storedToken);
          setIsLoggedIn(true);
        }

        if (storedUser) {
          const parsed: User = JSON.parse(storedUser);
          setUser(parsed);
          // Both token AND role must be present for admin access
          if (storedToken && parsed.role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error loading auth from localStorage:", error);
      }
    }
    setIsHydrated(true);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: "admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || `Login failed`;
        console.error("Login error response:", { status: response.status, data });
        return { success: false, message: errorMessage };
      }

      const receivedToken = data.token || "";
      const receivedUser = data.user || {};

      if (isBrowser) {
        localStorage.setItem("adminToken", receivedToken);
        localStorage.setItem("adminData", JSON.stringify(receivedUser));
      }

      setToken(receivedToken);
      setUser(receivedUser);
      setIsLoggedIn(true);
      setIsAdmin(receivedUser?.role === "admin");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Frontend login error:", errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    if (isBrowser) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
    }
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  // Don't render children until hydrated (to prevent SSR/client mismatch)
  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
