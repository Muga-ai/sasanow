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

    // Not logged in → send to login
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    // Logged in but no Firestore profile yet → send to onboarding
    if (!sasaUser) {
      router.replace("/onboarding");
      return;
    }

    // Wrong role → send to their correct dashboard
    if (requiredRole && sasaUser.role !== requiredRole) {
      if (sasaUser.role === "admin") router.replace("/admin");
      else if (sasaUser.role === "rider") router.replace("/rider");
      else router.replace("/dashboard");
    }
  }, [loading, firebaseUser, sasaUser, requiredRole, router]);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-content-center bg-[#F8F6F1]">
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

  // Not authed — render nothing (redirect is in progress)
  if (!firebaseUser || !sasaUser) return null;

  // Role mismatch — render nothing
  if (requiredRole && sasaUser.role !== requiredRole) return null;

  return <>{children}</>;
}
