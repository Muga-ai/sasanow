import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";

// ── Send OTP ──────────────────────────────────────────────
export async function sendOTP(
  phone: string,
  containerId: string
): Promise<ConfirmationResult> {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });

  return signInWithPhoneNumber(auth, phone, verifier);
}

// ── Sign out ──────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Get current user (one-shot) ──────────────────────────
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ── Listen to auth changes ────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
