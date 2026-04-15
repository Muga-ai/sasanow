"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { subscribeToCustomerOrders } from "@/lib/firestore";
import type { Order } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending:    { bg: "#FEF3DC", text: "#854F0B", label: "Finding rider", icon: "🔍" },
  accepted:   { bg: "#E6F5ED", text: "#0F6E56", label: "Rider assigned", icon: "🏍️" },
  picked_up:  { bg: "#E6F1FB", text: "#185FA5", label: "Picked up", icon: "📦" },
  on_the_way: { bg: "#EEEDFE", text: "#534AB7", label: "On the way", icon: "🚀" },
  delivered:  { bg: "#EAF3DE", text: "#3B6D11", label: "Delivered", icon: "✅" },
  cancelled:  { bg: "#FCEBEB", text: "#A32D2D", label: "Cancelled", icon: "❌" },
};

function CustomerOrdersContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "past">("all");

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToCustomerOrders(firebaseUser.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseUser]);

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const past = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  const displayed =
    filter === "all" ? orders :
    filter === "active" ? active : past;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* Nav */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)",
        padding: "0 20px", height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "transparent", border: "none", fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65", cursor: "pointer" }}>
          ← Home
        </button>
        <span style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 800, color: "#111210" }}>
          My orders
        </span>
        <div style={{ width: 60 }} />
      </nav>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 0, background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", padding: 4, marginBottom: 20 }}>
          {(["all", "active", "past"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1, padding: "9px", borderRadius: 8, border: "none",
                background: filter === f ? "#111210" : "transparent",
                fontFamily: "var(--font-dm)", fontSize: 13, fontWeight: filter === f ? 600 : 400,
                color: filter === f ? "#fff" : "#6B6A65",
                cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
              }}
            >
              {f}
              {f === "active" && active.length > 0 && (
                <span style={{ marginLeft: 6, background: "#E8A020", color: "#111210", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                  {active.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontFamily: "var(--font-dm)", color: "#9B9A95" }}>Loading your orders...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {filter === "active" ? "🏍️" : "📦"}
            </div>
            <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#111210", marginBottom: 8 }}>
              {filter === "active" ? "No active orders" : filter === "past" ? "No past orders" : "No orders yet"}
            </p>
            <p style={{ fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65", marginBottom: 20 }}>
              {filter === "active" ? "Place an order and it'll appear here" : "Your completed deliveries will show here"}
            </p>
            <button
              onClick={() => router.push("/checkout")}
              style={{ background: "#E8A020", border: "none", borderRadius: 10, padding: "12px 28px", fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14, color: "#111210", cursor: "pointer" }}
            >
              Order sasa →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayed.map((order) => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  style={{
                    background: "#fff", borderRadius: 14,
                    border: ["pending", "accepted", "picked_up", "on_the_way"].includes(order.status)
                      ? "1.5px solid #E8A020"
                      : "1px solid rgba(0,0,0,0.07)",
                    padding: "16px 18px", cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{sc.icon}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 15, color: "#111210", marginBottom: 1 }}>
                          {order.serviceType}
                        </p>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65" }}>
                          {order.description.slice(0, 44)}{order.description.length > 44 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, fontFamily: "var(--font-dm)", whiteSpace: "nowrap", marginLeft: 10 }}>
                      {sc.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95" }}>
                        {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short" })} ·{" "}
                        {order.createdAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {order.riderName && (
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65", marginTop: 1 }}>
                          Rider: {order.riderName}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 16, color: "#111210" }}>
                        KES {order.amountKes.toLocaleString()}
                      </p>
                      <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: order.paid ? "#1F6B3A" : "#854F0B", marginTop: 1 }}>
                        {order.paid ? "✓ Paid" : "Unpaid"}
                      </p>
                    </div>
                  </div>

                  {/* Active order CTA */}
                  {["pending", "accepted", "picked_up", "on_the_way"].includes(order.status) && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(232,160,32,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#854F0B", fontWeight: 500 }}>
                        Track live →
                      </p>
                      {order.estimatedMinutes && (
                        <span style={{ background: "#FEF3DC", color: "#854F0B", fontSize: 12, fontWeight: 500, padding: "2px 10px", borderRadius: 20, fontFamily: "var(--font-dm)" }}>
                          ~{order.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <AuthGuard requiredRole="customer">
      <CustomerOrdersContent />
    </AuthGuard>
  );
}
