"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { subscribeToOrder } from "@/lib/firestore";
import type { Order } from "@/types";

const STATUS_STEPS = [
  { key: "pending",    label: "Order placed",     sub: "Finding a rider near you" },
  { key: "accepted",   label: "Rider assigned",   sub: "Your rider is heading to pick up" },
  { key: "picked_up",  label: "Picked up",        sub: "Items collected" },
  { key: "on_the_way", label: "On the way",       sub: "Your rider is heading to you" },
  { key: "delivered",  label: "Delivered",        sub: "Order complete" },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0, accepted: 1, picked_up: 2, on_the_way: 3, delivered: 4,
};

function formatTime(ts: any) {
  if (!ts) return "";
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: any) {
  if (!ts) return "";
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

function TrackingContent({ orderId }: { orderId: string }) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToOrder(orderId, (o) => {
      setOrder(o);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12, background: "#E8A020",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-dm)", color: "#6B6A65", fontSize: 14 }}>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <p style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "#111210" }}>Order not found</p>
        <button onClick={() => router.push("/dashboard")} style={ghostBtn}>Back to home</button>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const currentStep = STATUS_INDEX[order.status] ?? 0;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px" }}>

      {/* Status hero */}
      <div
        style={{
          background: isCancelled ? "#FCEBEB" : isDelivered ? "#EAF3DE" : "#E8A020",
          borderRadius: 16,
          padding: "24px 20px",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>
          {isCancelled ? "❌" : isDelivered ? "✅" : "🏍️"}
        </div>
        <h2
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: 22,
            fontWeight: 800,
            color: isCancelled ? "#A32D2D" : isDelivered ? "#27500A" : "#111210",
            marginBottom: 4,
          }}
        >
          {isCancelled
            ? "Order cancelled"
            : isDelivered
            ? "Delivered!"
            : STATUS_STEPS[currentStep]?.label}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm)",
            fontSize: 14,
            color: isCancelled ? "#791F1F" : isDelivered ? "#3B6D11" : "#4A3200",
          }}
        >
          {isCancelled
            ? "This order was cancelled"
            : isDelivered
            ? `Completed at ${formatTime(order.updatedAt)}`
            : STATUS_STEPS[currentStep]?.sub}
        </p>

        {!isCancelled && !isDelivered && order.estimatedMinutes && (
          <div
            style={{
              marginTop: 14,
              display: "inline-block",
              background: "rgba(0,0,0,0.08)",
              borderRadius: 20,
              padding: "6px 16px",
            }}
          >
            <span style={{ fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 13, color: "#111210" }}>
              ~{order.estimatedMinutes} min estimated
            </span>
          </div>
        )}
      </div>

      {/* Progress steps */}
      {!isCancelled && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.07)",
            padding: "20px",
            marginBottom: 16,
          }}
        >
          {STATUS_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const future = i > currentStep;

            return (
              <div key={step.key} style={{ display: "flex", gap: 14, marginBottom: i < STATUS_STEPS.length - 1 ? 4 : 0 }}>
                {/* Line + dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: done ? "#1F6B3A" : active ? "#E8A020" : "#F1EFE8",
                      border: active ? "3px solid #E8A020" : done ? "none" : "2px solid #D3D1C7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.3s",
                    }}
                  >
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 28, background: done ? "#1F6B3A" : "#F1EFE8", margin: "3px 0", borderRadius: 1 }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-dm)",
                      fontWeight: active ? 600 : 400,
                      fontSize: 14,
                      color: future ? "#B4B2A9" : "#111210",
                      marginBottom: 2,
                    }}
                  >
                    {step.label}
                  </p>
                  {(done || active) && (
                    <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#9B9A95" }}>
                      {step.sub}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rider info */}
      {order.riderId && order.riderName && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.07)",
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#FEF3DC",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 16, color: "#854F0B",
              flexShrink: 0,
            }}
          >
            {order.riderName.charAt(0)}
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14, color: "#111210", marginBottom: 2 }}>
              {order.riderName}
            </p>
            <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65" }}>Your rider</p>
          </div>
          <a
            href={`tel:${order.customerPhone}`}
            style={{
              marginLeft: "auto",
              background: "#E6F5ED",
              color: "#0F6E56",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "var(--font-dm)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Call
          </a>
        </div>
      )}

      {/* Order summary */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.07)",
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 14, color: "#111210", marginBottom: 14 }}>
          Order summary
        </p>
        {[
          ["Service", order.serviceType],
          ["Details", order.description],
          ["Deliver to", order.dropoffAddress],
          ["Date", `${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}`],
          ["Order ID", orderId.slice(0, 8).toUpperCase()],
          ["Payment", order.paid ? "✓ Paid via M-Pesa" : "Awaiting payment"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "#6B6A65", flexShrink: 0 }}>{label}</span>
            <span
              style={{
                fontFamily: "var(--font-dm)", fontSize: 13,
                color: label === "Payment" && order.paid ? "#1F6B3A" : "#111210",
                fontWeight: label === "Payment" && order.paid ? 600 : 400,
                textAlign: "right",
              }}
            >
              {value}
            </span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14, color: "#111210" }}>Total</span>
          <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 16, color: "#111210" }}>
            KES {order.amountKes.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ ...ghostBtn, flex: 1 }}
        >
          ← Dashboard
        </button>
        {isDelivered && (
          <button
            onClick={() => router.push("/checkout")}
            style={{
              flex: 1, background: "#E8A020", border: "none", borderRadius: 10,
              fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14,
              color: "#111210", padding: "12px", cursor: "pointer",
            }}
          >
            Order again →
          </button>
        )}
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 10,
  padding: "12px 20px",
  fontFamily: "var(--font-dm)",
  fontWeight: 500,
  fontSize: 14,
  color: "#6B6A65",
  cursor: "pointer",
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  return (
    <AuthGuard requiredRole="customer">
      <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
        <nav
          style={{
            background: "#fff",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            padding: "0 20px",
            height: 60,
            display: "flex",
            alignItems: "center",
            gap: 16,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <a href="/dashboard" style={{ color: "#6B6A65", textDecoration: "none", fontSize: 20 }}>←</a>
          <span style={{ fontFamily: "var(--font-syne)", fontSize: 17, fontWeight: 800, color: "#111210" }}>
            Track order
          </span>
          <div
            style={{
              marginLeft: "auto",
              width: 8, height: 8, borderRadius: "50%",
              background: "#1F6B3A",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <span style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#1F6B3A" }}>Live</span>
        </nav>
        <TrackingContent orderId={orderId} />
      </div>
    </AuthGuard>
  );
}
