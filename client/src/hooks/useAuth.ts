import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface User {
  id: number;
  fullName: string;
  email: string;
  emailVerified?: boolean;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const { data: serverUser, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        throw new Error("Invalid token");
      }
      
      return response.json();
    },
  });

  // Update user data if server returns different data
  useEffect(() => {
    if (serverUser && JSON.stringify(serverUser) !== JSON.stringify(user)) {
      setUser(serverUser);
      localStorage.setItem("user", JSON.stringify(serverUser));
    }
  }, [serverUser, user]);

  return {
    user: user || serverUser,
    isLoading: isLoading && !!token,
    isAuthenticated: !!(token && (user || serverUser)),
  };
}
