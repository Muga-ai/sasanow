"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { firebaseUser, sasaUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ❌ Not logged in
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    // ⏳ Wait for Firestore user to load
    if (sasaUser === null) return;

    // ❌ No profile → onboarding
    if (!sasaUser) {
      router.replace("/onboarding");
      return;
    }

    // ✅ Role-based protection
    if (requiredRole && sasaUser.role !== requiredRole) {
      if (sasaUser.role === "admin") router.replace("/admin");
      else if (sasaUser.role === "rider") router.replace("/rider");
      else router.replace("/dashboard");
      return;
    }
  }, [loading, firebaseUser, sasaUser, requiredRole, router]);

  // ⏳ Show loader while auth or Firestore is resolving
  if (loading || (firebaseUser && sasaUser === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <div className="flex flex-col items-center gap-4">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#E8A020",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 13L7 7L11 11L11 7.5L16 13"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              width: 32,
              height: 3,
              borderRadius: 99,
              background: "#E8A020",
              opacity: 0.3,
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    );
  }

  // ❌ Not logged in (redirect already triggered)
  if (!firebaseUser) return null;

  // ❌ No profile (redirect already triggered)
  if (!sasaUser) return null;

  // ❌ Role mismatch (redirect already triggered)
  if (requiredRole && sasaUser.role !== requiredRole) return null;

  return <>{children}</>;
}