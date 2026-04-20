"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser } from "@/lib/firestore";
import toast from "react-hot-toast";

type LoginMethod = "phone" | "email";

const BILLING_ERROR_CODES = [
  "auth/billing-not-enabled",
  "auth/quota-exceeded",
  "auth/too-many-requests",
];

export default function LoginPage() {
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phone, setPhone] = useState("+254");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  /* ─── Phone OTP ─── */
  async function handleSendOTP() {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 13) {
      return toast.error("Enter a valid Kenyan number e.g. +254 7XX XXX XXX");
    }
    setLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        cleaned,
        recaptchaVerifier
      );
      (window as any).__sasaConfirmation = confirmationResult;
      (window as any).__sasaPhone = cleaned;
      (window as any).__sasaLoginMethod = "phone";
      toast.success("OTP sent to " + cleaned);
      router.push("/verify");
    } catch (err: any) {
      console.error(err);
      if (BILLING_ERROR_CODES.includes(err?.code)) {
        toast.error(
          "SMS is temporarily unavailable. Please use email login instead.",
          { duration: 5000 }
        );
        setMethod("email");
      } else {
        toast.error(err?.message || "Could not send OTP. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ─── Email / Password ─── */
  async function handleEmailLogin() {
    if (!email.trim()) return toast.error("Enter your email address");
    if (!password) return toast.error("Enter your password");
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = credential.user.uid;
      (window as any).__sasaLoginMethod = "email";
      const existing = await getUser(uid);
      if (!existing) {
        router.replace("/onboarding");
      } else {
        if (existing.role === "admin") router.replace("/admin");
        else if (existing.role === "rider") router.replace("/rider");
        else router.replace("/dashboard");
      }
      toast.success("Welcome back!");
    } catch (err: any) {
      console.error(err);
      const msg: Record<string, string> = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Try again.",
        "auth/invalid-email": "That email address doesn't look right.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      toast.error(msg[err?.code] || err?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = () =>
    method === "phone" ? handleSendOTP() : handleEmailLogin();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #F8F6F1;
          min-height: 100vh;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #F8F6F1;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
        }

        /* ── Logo ── */
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
          margin-bottom: 4px;
        }

        .logo-name span { color: #E8A020; }

        .logo-sub {
          font-size: 14px; color: #6B6A65; line-height: 1.5;
        }

        /* ── Method Toggle ── */
        .method-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 24px;
          gap: 0;
        }

        .toggle-btn {
          padding: 9px 0;
          border: none;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          background: transparent;
          color: #6B6A65;
        }

        .toggle-btn.active {
          background: #fff;
          color: #111210;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* ── Card ── */
        .login-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          padding: 28px 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
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

        .field-wrap { margin-bottom: 16px; }

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
          -webkit-appearance: none;
        }

        .field-input:focus {
          border-color: #E8A020;
          box-shadow: 0 0 0 3px rgba(232,160,32,0.12);
        }

        .password-wrap {
          position: relative;
        }

        .password-wrap .field-input {
          padding-right: 44px;
        }

        .pw-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; padding: 4px;
          color: #9B9A95;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }

        .pw-toggle:hover { color: #111210; }

        .billing-banner {
          background: #FEF3DC;
          border: 1px solid rgba(232,160,32,0.3);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 16px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .billing-banner-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        .billing-banner-text {
          font-size: 13px;
          color: #6B3A00;
          line-height: 1.45;
        }

        .billing-banner-text strong { font-weight: 600; }

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
          margin-top: 4px;
          letter-spacing: -0.1px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #C4871A;
          transform: translateY(-1px);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          background: #F5C97A;
          cursor: not-allowed;
        }

        .login-note {
          margin-top: 14px;
          font-size: 12px;
          color: #9B9A95;
          text-align: center;
          line-height: 1.5;
        }

        .footer-legal {
          margin-top: 20px;
          font-size: 12px;
          color: #9B9A95;
          text-align: center;
        }

        .footer-legal a {
          color: #E8A020;
          text-decoration: none;
        }

        .footer-legal a:hover { text-decoration: underline; }

        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0;
          color: #C8C7C2;
          font-size: 12px;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0,0,0,0.08);
        }

        @media (max-width: 440px) {
          .login-card { padding: 22px 18px; }
        }
      `}</style>

      <div className="login-page">
        <div className="login-container">

          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-mark">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="logo-name">sasa<span>now</span></div>
            <div className="logo-sub">Sign in to your account</div>
          </div>

          {/* Method toggle */}
          <div className="method-toggle">
            <button
              className={`toggle-btn${method === "phone" ? " active" : ""}`}
              onClick={() => setMethod("phone")}
            >
              📱 Phone OTP
            </button>
            <button
              className={`toggle-btn${method === "email" ? " active" : ""}`}
              onClick={() => setMethod("email")}
            >
              ✉️ Email
            </button>
          </div>

          {/* Card */}
          <div className="login-card">

            {method === "phone" && (
              <>
                <div className="billing-banner">
                  <span className="billing-banner-icon">ℹ️</span>
                  <div className="billing-banner-text">
                    <strong>Heads up:</strong> Phone OTP requires Firebase billing to be enabled. If it fails, switch to email login above.
                  </div>
                </div>
                <div className="field-wrap">
                  <label className="field-label">Phone number</label>
                  <input
                    className="field-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="+254 7XX XXX XXX"
                    autoComplete="tel"
                  />
                </div>
                <div id="recaptcha-container" />
                <button
                  className="btn-submit"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? "Sending OTP…" : "Send OTP →"}
                </button>
                <p className="login-note">
                  We will send a one-time code via SMS.<br />Standard rates may apply.
                </p>
              </>
            )}

            {method === "email" && (
              <>
                <div className="field-wrap">
                  <label className="field-label">Email address</label>
                  <input
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="field-wrap">
                  <label className="field-label">Password</label>
                  <div className="password-wrap">
                    <input
                      className="field-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      className="pw-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  className="btn-submit"
                  onClick={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in →"}
                </button>
                <p className="login-note">
                  Do not have an account?{" "}
                  <a href="/signup" style={{ color: "#E8A020" }}>Create one</a>
                </p>
              </>
            )}
          </div>

          {/* Legal */}
          <p className="footer-legal">
            By continuing you agree to our{" "}
            <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy Policy</a>
          </p>
<p className="note" style={{ marginTop: 20 }}>
  Want to deliver with Sasa Now?{" "}
  <a href="/rider/signup">Apply as a rider</a>
</p>
        </div>
      </div>
    </>
  );
}
