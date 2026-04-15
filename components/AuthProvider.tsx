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
  const [sasaUser, setSasaUser] = useState<SasaUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSasaUser(uid: string) {
    const profile = await getUser(uid);
    setSasaUser(profile);
  }

  async function refreshUser() {
    if (firebaseUser) {
      await loadSasaUser(firebaseUser.uid);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
    <AuthContext.Provider value={{ firebaseUser, sasaUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
