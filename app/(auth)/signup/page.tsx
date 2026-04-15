"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim()) return toast.error("Enter your email");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      // mark login method
      (window as any).__sasaLoginMethod = "email";

      toast.success("Account created 🎉");
      router.replace("/onboarding");
    } catch (err: any) {
      console.error(err);
      const msg: Record<string, string> = {
        "auth/email-already-in-use": "Email already in use",
        "auth/invalid-email": "Invalid email address",
        "auth/weak-password": "Password is too weak",
      };
      toast.error(msg[err?.code] || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #F8F6F1;
        }

        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: #F8F6F1;
        }

        .signup-container {
          width: 100%;
          max-width: 400px;
        }

        .logo-wrap { margin-bottom: 32px; }

        .logo-mark {
          width: 46px; height: 46px;
          background: #E8A020;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #111210; letter-spacing: -0.5px;
        }

        .logo-name span { color: #E8A020; }

        .signup-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #111210; margin-top: 8px; margin-bottom: 6px;
        }

        .signup-sub {
          font-size: 14px; color: #6B6A65; line-height: 1.5;
        }

        .signup-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          padding: 28px 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #111210;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .field-input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(0,0,0,0.11);
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #111210;
          background: #FAFAF8;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field-input:focus {
          border-color: #E8A020;
          box-shadow: 0 0 0 3px rgba(232,160,32,0.12);
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background: #E8A020;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #111210;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #C4871A;
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          background: #F5C97A;
          cursor: not-allowed;
        }

        .alt-link {
          margin-top: 14px;
          font-size: 12px;
          color: #9B9A95;
          text-align: center;
          text-decoration: none;
        }

        .alt-link:hover { color: #E8A020; }

        @media (max-width: 440px) {
          .signup-card { padding: 22px 18px; }
        }
      `}</style>

      <div className="signup-page">
        <div className="signup-container">

          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-mark">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="logo-name">sasa<span>now</span></div>
            <div className="signup-title">Create your account</div>
            <p className="signup-sub">
              Get started in seconds — we’ll set things up after this.
            </p>
          </div>

          {/* Card */}
          <div className="signup-card">

            {/* Email */}
            <div>
              <label className="field-label">Email</label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />
            </div>

            {/* Submit */}
            <button
              className="btn-submit"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? "Creating account…" : "Continue →"}
            </button>
          </div>

          <a href="/login" className="alt-link">
            Already have an account? Sign in
          </a>

        </div>
      </div>
    </>
  );
}