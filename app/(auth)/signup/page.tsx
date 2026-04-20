"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUser } from "@/lib/firestore";
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

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "profile">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState("");

  async function handleCreateAccount() {
    if (!email.trim()) return toast.error("Enter your email");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      setUid(credential.user.uid);
      setStep("profile");
    } catch (err: any) {
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "Email already registered. Sign in instead.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password is too weak.",
      };
      toast.error(msgs[err?.code] || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!name.trim()) return toast.error("Enter your full name");
    if (!area) return toast.error("Select your area");
    if (!uid) return;

    setLoading(true);
    try {
      await createUser(uid, {
        phone: "",
        email: email.trim(),
        name: name.trim(),
        role: "customer",
        location: { area } as any,
      } as any);

      toast.success(`Welcome to Sasa Now, ${name.split(" ")[0]}! 🎉`);
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save profile. Try again.");
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
        .container { width: 100%; max-width: 400px; }

        .logo-mark { width: 46px; height: 46px; background: #E8A020; border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
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
        .field input, .field select { width: 100%; padding: 13px 14px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.11); font-size: 15px; font-family: 'DM Sans', sans-serif; color: #111210; background: #FAFAF8; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .field input:focus, .field select:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.12); }
        .field select { appearance: none; cursor: pointer; }

        .btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 15px; color: #111210; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background: #E8A020; }
        .btn-primary:hover:not(:disabled) { background: #C4871A; }
        .btn-primary:disabled { background: #F5C97A; cursor: not-allowed; }

        .note { font-size: 12px; color: #9B9A95; text-align: center; line-height: 1.5; }
        .note a { color: #E8A020; text-decoration: none; }

        .rider-banner { background: #111210; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12; margin-top: 16px; }
        .rider-banner p { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.4; }
        .rider-banner a { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #E8A020; text-decoration: none; white-space: nowrap; }
      `}</style>

      <div className="page">
        <div className="container">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-name">sasa<span>now</span></div>
          <div className="page-title">{step === "account" ? "Create your account" : "One more step"}</div>
          <p className="page-sub">
            {step === "account" ? "Order groceries, errands and more across Nairobi." : "Tell us where you are so we can find riders near you."}
          </p>

          <div className="progress">
            <div className={`progress-bar ${step === "account" || step === "profile" ? "done" : "pending"}`} />
            <div className={`progress-bar ${step === "profile" ? "done" : "pending"}`} />
          </div>

          {step === "account" && (
            <div className="card">
              <div className="field">
                <label>Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/>
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}/>
              </div>
              <button className="btn btn-primary" onClick={handleCreateAccount} disabled={loading}>
                {loading ? "Creating account..." : "Continue →"}
              </button>
              <p className="note">Already have an account? <a href="/login">Sign in</a></p>
            </div>
          )}

          {step === "profile" && (
            <div className="card">
              <div className="field">
                <label>Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amina Odhiambo" autoFocus/>
              </div>
              <div className="field">
                <label>Your area in Nairobi</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} style={{ color: area ? "#111210" : "#9B9A95" }}>
                  <option value="" disabled>Select your area...</option>
                  {nairobiAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleCompleteProfile} disabled={loading}>
                {loading ? "Setting up account..." : "Get started →"}
              </button>
              <p className="note">Your info is used to match you with nearby riders.</p>
            </div>
          )}

          {/* Rider CTA */}
          <div className="rider-banner">
            <p>Want to earn delivering across Nairobi?</p>
            <a href="/rider/signup">Become a rider →</a>
          </div>
        </div>
      </div>
    </>
  );
}
