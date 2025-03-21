// app/components/AuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  session: any;
  setSession: (session: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Fetch the current session on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for session removal and clear cookie manually if needed.
  useEffect(() => {
    if (!session) {
      // Clear the cookie manually.
      document.cookie =
        "supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }, [session]);

  // Instant realtime update: if the user's profile row is deleted, clear session.
  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;
    const channel = supabase
      .channel(`public:profiles:user=${userId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log("Profile deleted, clearing session:", payload);
          setSession(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
