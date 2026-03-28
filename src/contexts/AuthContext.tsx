import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "electricity" | "water" | "waste" | "air" | "head" | "student";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const roleProfiles: Record<UserRole, { name: string }> = {
  electricity: { name: "Electricity Admin" },
  water: { name: "Water Admin" },
  waste: { name: "Waste Management Admin" },
  air: { name: "Air Purifier Admin" },
  head: { name: "Head User" },
  student: { name: "Student Ambassador" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((role: UserRole) => {
    setUser({
      id: crypto.randomUUID(),
      name: roleProfiles[role].name,
      role,
    });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
