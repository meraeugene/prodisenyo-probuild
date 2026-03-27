"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/types/auth";

interface AuthSessionContextValue {
  user: SessionUser;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser;
}) {
  return (
    <AuthSessionContext.Provider value={{ user }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider.");
  }
  return context;
}
