"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
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

export default function OnboardingPage() {
  const { firebaseUser, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);

  // Derive login method from session or firebaseUser
  const loginMethod =
    typeof window !== "undefined"
      ? (window as any).__sasaLoginMethod || "email"
      : "email";

  // Prefill phone number hint if phone login
  const phoneHint =
    loginMethod === "phone" && firebaseUser?.phoneNumber
      ? firebaseUser.phoneNumber
      : null;

  // Guard: must be authenticated
  useEffect(() => {
    if (!firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, router]);

  async function handleSubmit() {
    if (!name.trim()) return toast.error("Please enter your name");
    if (!area) return toast.error("Please select your area");
    if (!firebaseUser) return router.replace("/login");

    setLoading(true);
    try {
      await createUser(firebaseUser.uid, {
        phone: firebaseUser.phoneNumber || "",
        email: firebaseUser.email || "",
        name: name.trim(),
        role: "customer",
        location: { area },
        loginMethod,
      } as any);

      await refreshUser();
      const firstName = name.trim().split(" ")[0];
      toast.success(`Welcome to Sasa Now, ${firstName}! 🎉`);
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!firebaseUser) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #F8F6F1;
        }

        .onboard-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: #F8F6F1;
        }

        .onboard-container {
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

        .onboard-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #111210; margin-top: 8px; margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .onboard-sub {
          font-size: 14px; color: #6B6A65; line-height: 1.5;
        }

        /* Progress indicator */
        .progress-steps {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 28px;
        }

        .progress-step {
          height: 3px;
          border-radius: 99px;
          flex: 1;
          background: rgba(0,0,0,0.08);
          transition: background 0.3s;
        }

        .progress-step.done { background: #E8A020; }
        .progress-step.active { background: #E8A020; opacity: 0.45; }

        /* Card */
        .onboard-card {
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

        .field-input,
        .field-select {
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
          -webkit-appearance: none;
        }

        .field-input:focus,
        .field-select:focus {
          border-color: #E8A020;
          box-shadow: 0 0 0 3px rgba(232,160,32,0.12);
        }

        .field-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%239B9A95' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }

        .field-select option { color: #111210; }

        /* Identity chip — shows their login identifier */
        .identity-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: #6B6A65;
          margin-bottom: -4px;
        }

        .identity-chip strong {
          color: #111210;
          font-weight: 500;
        }

        .identity-chip .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #27AE60;
          flex-shrink: 0;
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
          letter-spacing: -0.1px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #C4871A;
          transform: translateY(-1px);
        }

        .btn-submit:active:not(:disabled) { transform: translateY(0); }

        .btn-submit:disabled {
          background: #F5C97A;
          cursor: not-allowed;
        }

        .trust-note {
          margin-top: 18px;
          font-size: 12px;
          color: #9B9A95;
          text-align: center;
          line-height: 1.5;
        }

        .change-method {
          display: block;
          margin-top: 14px;
          font-size: 12px;
          color: #9B9A95;
          text-align: center;
          text-decoration: none;
          transition: color 0.2s;
        }

        .change-method:hover { color: #E8A020; }

        @media (max-width: 440px) {
          .onboard-card { padding: 22px 18px; }
        }
      `}</style>

      <div className="onboard-page">
        <div className="onboard-container">

          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-mark">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="logo-name">sasa<span>now</span></div>
            <div className="onboard-title">Almost there 🎉</div>
            <p className="onboard-sub">
              Tell us a bit about yourself so we can serve you better.
            </p>
          </div>

          {/* Progress */}
          <div className="progress-steps">
            <div className="progress-step done" />
            <div className="progress-step done" />
            <div className="progress-step active" />
          </div>

          {/* Card */}
          <div className="onboard-card">

            {/* Identity chip — confirm who they are */}
            <div className="identity-chip">
              <div className="dot" />
              {loginMethod === "phone" && phoneHint ? (
                <span>Signed in as <strong>{phoneHint}</strong></span>
              ) : firebaseUser.email ? (
                <span>Signed in as <strong>{firebaseUser.email}</strong></span>
              ) : (
                <span><strong>Account verified ✓</strong></span>
              )}
            </div>

            {/* Full name */}
            <div>
              <label className="field-label">Full name</label>
              <input
                className="field-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="e.g. Amina Odhiambo"
                autoFocus
              />
            </div>

            {/* Area */}
            <div>
              <label className="field-label">Your area in Nairobi</label>
              <select
                className="field-select"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                style={{ color: area ? "#111210" : "#9B9A95" }}
              >
                <option value="" disabled>Select your area…</option>
                {nairobiAreas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Setting up your account…" : "Get started →"}
            </button>
          </div>

          <p className="trust-note">
            Your info is only used to personalise your experience<br />
            and connect you with nearby riders.
          </p>

          <a href="/login" className="change-method">
            ← Change login method
          </a>

        </div>
      </div>
    </>
  );
}
