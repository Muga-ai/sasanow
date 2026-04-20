"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUser } from "@/lib/firestore";
import { setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Rider } from "@/types";
import toast from "react-hot-toast";

const nairobiAreas = [
  "Buruburu", "Dagoretti", "Donholm", "Eastleigh", "Embakasi",
  "Garden Estate", "Gigiri", "Githurai", "Kahawa Wendani", "Kahawa West",
  "Karen", "Kasarani", "Kawangware", "Kayole", "Kibera",
  "Kilimani", "Komarock", "Langata", "Lavington", "Muthaiga",
  "Parklands", "Pipeline", "Ridgeways", "Roysambu", "Ruaka",
  "Ruiru", "Runda", "South B", "South C", "Spring Valley",
  "Thika Road", "Umoja", "Westlands", "Zimmerman",
];

export default function RiderSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "profile">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+254");
  const [area, setArea] = useState("");
  const [vehicleType, setVehicleType] = useState<"bicycle" | "motorbike" | "car" | "">("");
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState("");

  async function handleCreateAccount() {
    if (!email.trim()) return toast.error("Enter your email");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      setUid(credential.user.uid);
      setStep("profile");
    } catch (err: any) {
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "This email is already registered. Try signing in.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password is too weak.",
      };
      toast.error(msgs[err?.code] || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!name.trim()) return toast.error("Enter your full name");
    if (phone.replace(/\D/g, "").length < 12) return toast.error("Enter a valid phone number");
    if (!area) return toast.error("Select your operating area");
    if (!vehicleType) return toast.error("Select your vehicle type");
    if (!uid) return toast.error("Account not found. Please restart.");

    setLoading(true);
    try {
      // Create user profile with rider role
      await createUser(uid, {
        phone: phone.trim(),
        email: email.trim(),
        name: name.trim(),
        role: "rider",
        location: { area } as any,
      } as any);

      // Create rider-specific record
      const rider: Rider = {
        uid,
        name: name.trim(),
        phone: phone.trim(),
        isOnline: false,
        isAvailable: false,
        totalDeliveries: 0,
        rating: 5.0,
      };
      await setDoc(doc(db, "riders", uid), {
        ...rider,
        area,
        vehicleType,
        email: email.trim(),
      });

      toast.success("Rider account created! Welcome to Sasa Now.");
      router.replace("/rider");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F6F1; }

        .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; }
        .container { width: 100%; max-width: 420px; }

        .logo-mark { width: 48px; height: 48px; background: #111210; border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .logo-name { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #111210; }
        .logo-name span { color: #E8A020; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #111210; margin-top: 8px; margin-bottom: 4px; }
        .page-sub { font-size: 14px; color: #6B6A65; line-height: 1.5; margin-bottom: 28px; }

        .progress { display: flex; gap: 6px; margin-bottom: 24px; }
        .progress-bar { height: 3px; border-radius: 99px; flex: 1; transition: background 0.3s; }
        .progress-bar.done { background: #E8A020; }
        .progress-bar.pending { background: rgba(0,0,0,0.1); }

        .card { background: #fff; border-radius: 18px; border: 1px solid rgba(0,0,0,0.07); padding: 28px 24px; display: flex; flex-direction: column; gap: 16px; }

        .field label { display: block; font-size: 12px; font-weight: 600; color: #111210; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 7px; }
        .field input, .field select {
          width: 100%; padding: 13px 14px; border-radius: 10px;
          border: 1.5px solid rgba(0,0,0,0.11); font-size: 15px;
          font-family: 'DM Sans', sans-serif; color: #111210;
          background: #FAFAF8; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field input:focus, .field select:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.12); }
        .field select { appearance: none; cursor: pointer; }

        .vehicle-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .vehicle-btn {
          padding: 14px 8px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1);
          background: #FAFAF8; font-family: 'DM Sans', sans-serif; font-size: 12px;
          font-weight: 500; color: #6B6A65; cursor: pointer; text-align: center;
          transition: all 0.15s;
        }
        .vehicle-btn.selected { border-color: #E8A020; background: #FEF3DC; color: #854F0B; font-weight: 600; }
        .vehicle-icon { font-size: 24px; display: block; margin-bottom: 6px; }

        .btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background: #E8A020; color: #111210; }
        .btn-primary:hover:not(:disabled) { background: #C4871A; }
        .btn-primary:disabled { background: #F5C97A; cursor: not-allowed; }
        .btn-dark { background: #111210; color: #fff; }
        .btn-dark:hover:not(:disabled) { background: #2C2C2A; }

        .note { font-size: 12px; color: #9B9A95; text-align: center; line-height: 1.5; }
        .note a { color: #E8A020; text-decoration: none; }

        .info-banner { background: #E6F5ED; border-radius: 10px; padding: 12px 14px; display: flex; gap: 10px; }
        .info-banner p { font-size: 13px; color: #0F6E56; line-height: 1.45; }
      `}</style>

      <div className="page">
        <div className="container">
          {/* Logo */}
          <div className="logo-mark">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="#E8A020" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-name">sasa<span>now</span></div>
          <div className="page-title">
            {step === "account" ? "Become a rider 🏍️" : "Complete your profile"}
          </div>
          <p className="page-sub">
            {step === "account"
              ? "Earn money delivering across Nairobi on your own schedule."
              : "Almost done — tell us a bit more about yourself."}
          </p>

          {/* Progress */}
          <div className="progress">
            <div className={`progress-bar ${step === "account" || step === "profile" ? "done" : "pending"}`} />
            <div className={`progress-bar ${step === "profile" ? "done" : "pending"}`} />
          </div>

          {/* Step 1 — Account */}
          {step === "account" && (
            <div className="card">
              <div className="info-banner">
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <p>Riders sign up with email. You can also accept orders through this same web app once approved.</p>
              </div>

              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
                />
              </div>

              <button
                className="btn btn-dark"
                onClick={handleCreateAccount}
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create rider account →"}
              </button>

              <p className="note">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </div>
          )}

          {/* Step 2 — Profile */}
          {step === "profile" && (
            <div className="card">
              <div className="field">
                <label>Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brian Otieno"
                  autoFocus
                />
              </div>

              <div className="field">
                <label>Phone number (M-Pesa)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                />
              </div>

              <div className="field">
                <label>Operating area</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} style={{ color: area ? "#111210" : "#9B9A95" }}>
                  <option value="" disabled>Select your area...</option>
                  {nairobiAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Vehicle type</label>
                <div className="vehicle-grid">
                  {[
                    { value: "bicycle", icon: "🚲", label: "Bicycle" },
                    { value: "motorbike", icon: "🏍️", label: "Motorbike" },
                    { value: "car", icon: "🚗", label: "Car" },
                  ].map((v) => (
                    <button
                      key={v.value}
                      className={`vehicle-btn ${vehicleType === v.value ? "selected" : ""}`}
                      onClick={() => setVehicleType(v.value as any)}
                    >
                      <span className="vehicle-icon">{v.icon}</span>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCompleteProfile}
                disabled={loading}
              >
                {loading ? "Saving profile..." : "Start delivering →"}
              </button>

              <p className="note">
                Your info will be shared with customers when you accept their orders.
              </p>
            </div>
          )}

          <p className="note" style={{ marginTop: 20 }}>
            Looking for deliveries? <a href="/login">Sign in as customer</a>
          </p>
        </div>
      </div>
    </>
  );
}
