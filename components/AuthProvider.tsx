"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser } from "@/lib/firestore";
import type { SasaUser } from "@/types";

interface AuthContextType {
  firebaseUser: User | null;
  sasaUser: SasaUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  sasaUser: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // 🔥 KEY CHANGE: undefined = loading, null = no profile
  const [sasaUser, setSasaUser] = useState<SasaUser | null | undefined>(undefined);

  const [loading, setLoading] = useState(true);

  async function loadSasaUser(uid: string) {
    try {
      const profile = await getUser(uid);

      if (profile) {
        setSasaUser(profile); // ✅ user exists
      } else {
        setSasaUser(null); // ❌ no profile → onboarding
      }
    } catch (err) {
      console.error("Error loading user:", err);
      setSasaUser(null);
    }
  }

  async function refreshUser() {
    if (firebaseUser) {
      setSasaUser(undefined); // 🔄 force reload state
      await loadSasaUser(firebaseUser.uid);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);

      if (user) {
        await loadSasaUser(user.uid);
      } else {
        setSasaUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        sasaUser: sasaUser ?? null, // keep external API clean
        loading: loading || sasaUser === undefined, // 🔥 ensures proper wait
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);