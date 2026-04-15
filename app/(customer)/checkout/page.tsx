"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { createOrder } from "@/lib/firestore";
import toast from "react-hot-toast";

const services = [
  "Groceries", "Pharmacy", "Errands", "Food",
  "Home Services", "Beauty", "Auto", "Pets", "Other",
];

const deliveryFees: Record<string, number> = {
  Groceries: 150, Pharmacy: 100, Errands: 200, Food: 120,
  "Home Services": 300, Beauty: 250, Auto: 350, Pets: 180, Other: 200,
};

function CheckoutForm() {
  const { sasaUser, firebaseUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [service, setService] = useState(searchParams.get("service") || "");
  const [description, setDescription] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [step, setStep] = useState<"form" | "payment" | "confirming">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fee = deliveryFees[service] || 200;

  useEffect(() => {
    if (sasaUser) {
      setMpesaPhone(firebaseUser?.phoneNumber || "");
      setPickupAddress((sasaUser as any)?.location?.area || "");
    }
  }, [sasaUser, firebaseUser]);

  async function handlePlaceOrder() {
    if (!service) return toast.error("Select a service");
    if (!description.trim()) return toast.error("Describe what you need");
    if (!pickupAddress.trim()) return toast.error("Enter pickup / your location");
    if (!dropoffAddress.trim()) return toast.error("Enter delivery address");
    if (!firebaseUser || !sasaUser) return router.replace("/login");

    setLoading(true);
    try {
      const id = await createOrder({
        customerId: firebaseUser.uid,
        customerPhone: firebaseUser.phoneNumber || "",
        serviceType: service,
        description: description.trim(),
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        pickupCoords: { lat: -1.2921, lng: 36.8219 },
        dropoffCoords: { lat: -1.2921, lng: 36.8219 },
        amountKes: fee,
        status: "pending",
        paid: false,
      });
      setOrderId(id);
      setStep("payment");
    } catch (err: any) {
      toast.error("Failed to create order. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMpesaPay() {
    if (!mpesaPhone || mpesaPhone.replace(/\s/g, "").length < 13) {
      return toast.error("Enter a valid M-Pesa number");
    }
    if (!orderId) return;

    setStep("confirming");
    setLoading(true);

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mpesaPhone.replace(/\s/g, ""),
          amount: fee,
          orderId,
          description: `Sasa Now - ${service}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "STK push failed");

      toast.success("Check your phone for the M-Pesa prompt!");

      // Poll for payment confirmation every 3s for up to 2 minutes
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const { getOrder } = await import("@/lib/firestore");
          const order = await getOrder(orderId);
          if (order?.paid) {
            clearInterval(interval);
            toast.success("Payment confirmed! Finding you a rider...");
            router.replace(`/orders/${orderId}`);
          }
          if (attempts >= 40) {
            clearInterval(interval);
            toast.error("Payment not confirmed. Check M-Pesa and try again.");
            setStep("payment");
            setLoading(false);
          }
        } catch {
          clearInterval(interval);
          setStep("payment");
          setLoading(false);
        }
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "M-Pesa request failed");
      setStep("payment");
      setLoading(false);
    }
  }

  // ── STEP: Form ────────────────────────────────────────────
  if (step === "form") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
        <nav style={navStyle}>
          <button onClick={() => router.back()} style={backBtnStyle}>← Back</button>
          <span style={logoStyle}>sasa<span style={{ color: "#E8A020" }}>now</span></span>
          <div style={{ width: 60 }} />
        </nav>

        <div style={pageStyle}>
          <h1 style={headingStyle}>New order</h1>
          <p style={subStyle}>Tell us what you need delivered sasa.</p>

          <div style={cardStyle}>
            <Field label="Service type">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {services.map((s) => (
                  <button
                    key={s}
                    onClick={() => setService(s)}
                    style={{
                      padding: "10px 4px",
                      borderRadius: 8,
                      border: service === s ? "2px solid #E8A020" : "1.5px solid rgba(0,0,0,0.1)",
                      background: service === s ? "#FEF3DC" : "#FAFAF8",
                      fontFamily: "var(--font-dm)",
                      fontSize: 13,
                      fontWeight: service === s ? 600 : 400,
                      color: service === s ? "#854F0B" : "#111210",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="What do you need?" hint="Be specific — helps us match the right rider">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Buy 2kg unga, 1 litre milk and bread from Naivas Westlands"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </Field>

            <Field label="Your location / pickup point">
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g. Westlands, near Sarit Centre"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </Field>

            <Field label="Delivery address">
              <input
                type="text"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                placeholder="e.g. Kilimani, Valley Arcade, Gate 4"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </Field>

            {service && (
              <div style={{ background: "#F8F6F1", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65" }}>Delivery fee</span>
                <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 20, color: "#111210" }}>
                  KES {fee.toLocaleString()}
                </span>
              </div>
            )}

            <button onClick={handlePlaceOrder} disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Creating order..." : "Continue to payment →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: Payment ─────────────────────────────────────────
  if (step === "payment") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
        <nav style={navStyle}>
          <button onClick={() => setStep("form")} style={backBtnStyle}>← Edit order</button>
          <span style={logoStyle}>sasa<span style={{ color: "#E8A020" }}>now</span></span>
          <div style={{ width: 80 }} />
        </nav>

        <div style={pageStyle}>
          <h1 style={headingStyle}>Pay with M-Pesa</h1>
          <p style={subStyle}>Enter your M-Pesa number to receive the payment prompt.</p>

          <div style={cardStyle}>
            <div style={{ background: "#F8F6F1", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={mutedText}>Service</span>
                <span style={boldText}>{service}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={mutedText}>Amount</span>
                <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 20, color: "#1F6B3A" }}>
                  KES {fee.toLocaleString()}
                </span>
              </div>
            </div>

            <Field label="M-Pesa number">
              <input
                type="tel"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
              <p style={{ fontSize: 12, color: "#9B9A95", fontFamily: "var(--font-dm)", marginTop: 4 }}>
                You will receive an M-Pesa PIN prompt on this number
              </p>
            </Field>

            <button onClick={handleMpesaPay} disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? "Sending prompt..." : `Pay KES ${fee.toLocaleString()} via M-Pesa →`}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#9B9A95", fontFamily: "var(--font-dm)" }}>
              Secured by Safaricom M-Pesa · Daraja API
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: Confirming ──────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📱</div>
        <h2 style={{ ...headingStyle, marginBottom: 12 }}>Check your phone</h2>
        <p style={{ fontFamily: "var(--font-dm)", fontSize: 15, color: "#6B6A65", lineHeight: 1.6, maxWidth: 320, margin: "0 auto 28px" }}>
          Enter your M-Pesa PIN on the prompt sent to{" "}
          <strong style={{ color: "#111210" }}>{mpesaPhone}</strong>
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#E8A020", opacity: 0.8 }} />
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "#9B9A95", marginTop: 20 }}>
          Waiting for payment confirmation...
        </p>
        <button
          onClick={() => { setStep("payment"); setLoading(false); }}
          style={{ marginTop: 16, background: "transparent", border: "none", fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65", cursor: "pointer", textDecoration: "underline" }}
        >
          Cancel and try again
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#111210", fontFamily: "var(--font-dm)" }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: "#9B9A95", marginLeft: 6 }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const navStyle: React.CSSProperties = {
  background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)",
  padding: "0 20px", height: 60, display: "flex", alignItems: "center",
  justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
};
const backBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", fontFamily: "var(--font-dm)",
  fontSize: 14, color: "#6B6A65", cursor: "pointer", padding: "8px 0",
};
const logoStyle: React.CSSProperties = {
  fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 800, color: "#111210",
};
const pageStyle: React.CSSProperties = {
  maxWidth: 480, margin: "0 auto", padding: "28px 16px 80px",
};
const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-syne)", fontSize: 24, fontWeight: 800, color: "#111210", marginBottom: 6,
};
const subStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65", marginBottom: 24,
};
const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)",
  padding: "24px", display: "flex", flexDirection: "column", gap: 20,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,0.12)", fontSize: 15,
  fontFamily: "var(--font-dm)", color: "#111210", outline: "none",
  background: "#FAFAF8", transition: "border-color 0.2s",
};
const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%", padding: "15px", background: disabled ? "#F5C97A" : "#E8A020",
  border: "none", borderRadius: 10, fontFamily: "var(--font-dm)", fontWeight: 600,
  fontSize: 15, color: "#111210", cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 0.2s",
});
const mutedText: React.CSSProperties = { fontFamily: "var(--font-dm)", fontSize: 13, color: "#6B6A65" };
const boldText: React.CSSProperties = { fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 14, color: "#111210" };

export default function CheckoutPage() {
  return (
    <AuthGuard requiredRole="customer">
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F8F6F1" }} />}>
        <CheckoutForm />
      </Suspense>
    </AuthGuard>
  );
}
