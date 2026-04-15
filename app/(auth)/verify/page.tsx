"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/firestore";
import toast from "react-hot-toast";

export default function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [hasConfirmation, setHasConfirmation] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedPhone = (window as any).__sasaPhone || "";
    const confirmation = (window as any).__sasaConfirmation;
    setPhone(storedPhone);
    if (!confirmation) {
      // No OTP session — redirect back to login
      toast.error("Session expired. Please try again.");
      router.replace("/login");
    } else {
      setHasConfirmation(true);
      // Auto-focus first input
      setTimeout(() => inputs.current[0]?.focus(), 100);
    }
  }, [router]);

  function handleChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setOtp(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) return toast.error("Enter the full 6-digit code");

    const confirmation = (window as any).__sasaConfirmation;
    if (!confirmation) return router.replace("/login");

    setLoading(true);
    try {
      const result = await confirmation.confirm(code);
      const uid = result.user.uid;
      (window as any).__sasaLoginMethod = "phone";

      const existing = await getUser(uid);
      if (!existing) {
        router.replace("/onboarding");
      } else {
        if (existing.role === "admin") router.replace("/admin");
        else if (existing.role === "rider") router.replace("/rider");
        else router.replace("/dashboard");
      }
      toast.success("Welcome to Sasa Now!");
    } catch (err: any) {
      console.error(err);
      const msg: Record<string, string> = {
        "auth/invalid-verification-code": "That code is incorrect. Please try again.",
        "auth/code-expired": "The code has expired. Please request a new one.",
      };
      toast.error(msg[err?.code] || "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  const codeComplete = otp.join("").length === 6;
  const maskedPhone =
    phone.length > 6
      ? phone.slice(0, 4) + " *** " + phone.slice(-3)
      : phone;

  if (!hasConfirmation) return null; // redirecting

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #F8F6F1;
        }

        .verify-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #F8F6F1;
        }

        .verify-container {
          width: 100%;
          max-width: 400px;
        }

        .logo-wrap { margin-bottom: 36px; }

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
          margin-bottom: 6px;
        }

        .logo-name span { color: #E8A020; }

        .verify-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #111210; margin-bottom: 6px;
        }

        .verify-sub {
          font-size: 14px; color: #6B6A65; line-height: 1.5;
        }

        .verify-sub strong { color: #111210; font-weight: 500; }

        .verify-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          padding: 28px 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
        }

        .otp-hint {
          font-size: 12px; font-weight: 600;
          color: #9B9A95; letter-spacing: 0.06em;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 16px;
        }

        .otp-grid {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .otp-cell {
          width: 48px;
          height: 56px;
          text-align: center;
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          border-radius: 11px;
          outline: none;
          transition: all 0.15s;
          -webkit-appearance: none;
        }

        .otp-cell.empty {
          border: 1.5px solid rgba(0,0,0,0.11);
          background: #FAFAF8;
          color: #111210;
        }

        .otp-cell.filled {
          border: 2px solid #E8A020;
          background: #FEF3DC;
          color: #111210;
        }

        .otp-cell:focus {
          border-color: #E8A020;
          box-shadow: 0 0 0 3px rgba(232,160,32,0.15);
        }

        .btn-verify {
          width: 100%;
          padding: 14px;
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

        .btn-verify.ready {
          background: #E8A020;
        }

        .btn-verify.ready:hover {
          background: #C4871A;
          transform: translateY(-1px);
        }

        .btn-verify.ready:active { transform: translateY(0); }

        .btn-verify.disabled {
          background: #F5E6C8;
          cursor: not-allowed;
        }

        .btn-back {
          width: 100%;
          margin-top: 10px;
          padding: 12px;
          background: transparent;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #6B6A65;
          cursor: pointer;
          transition: color 0.2s;
          text-align: center;
        }

        .btn-back:hover { color: #111210; }

        .try-email-note {
          margin-top: 20px;
          padding: 14px;
          background: #F8F6F1;
          border-radius: 10px;
          font-size: 12px;
          color: #6B6A65;
          text-align: center;
          line-height: 1.5;
        }

        .try-email-note a {
          color: #E8A020;
          font-weight: 500;
          text-decoration: none;
        }

        .try-email-note a:hover { text-decoration: underline; }

        @media (max-width: 400px) {
          .otp-cell { width: 42px; height: 50px; font-size: 20px; }
          .otp-grid { gap: 6px; }
        }
      `}</style>

      <div className="verify-page">
        <div className="verify-container">

          <div className="logo-wrap">
            <div className="logo-mark">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="logo-name">sasa<span>now</span></div>
            <div className="verify-title">Check your SMS</div>
            <p className="verify-sub">
              We sent a 6-digit code to{" "}
              <strong>{maskedPhone}</strong>
            </p>
          </div>

          <div className="verify-card">
            <div className="otp-hint">Enter 6-digit code</div>

            <div className="otp-grid">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  className={`otp-cell ${digit ? "filled" : "empty"}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onPaste={handlePaste}
                />
              ))}
            </div>

            <button
              className={`btn-verify ${codeComplete && !loading ? "ready" : "disabled"}`}
              onClick={handleVerify}
              disabled={!codeComplete || loading}
            >
              {loading ? "Verifying…" : "Verify & continue →"}
            </button>

            <button className="btn-back" onClick={() => router.replace("/login")}>
              ← Use a different number
            </button>
          </div>

          <div className="try-email-note">
            Not receiving SMS?{" "}
            <a href="/login">Switch to email login</a> instead.
          </div>

        </div>
      </div>
    </>
  );
}
