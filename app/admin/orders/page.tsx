"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { updateOrderStatus } from "@/lib/firestore";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/types";
import toast from "react-hot-toast";

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "#FEF3DC", text: "#854F0B" },
  accepted:   { bg: "#E6F5ED", text: "#0F6E56" },
  picked_up:  { bg: "#E6F1FB", text: "#185FA5" },
  on_the_way: { bg: "#EEEDFE", text: "#534AB7" },
  delivered:  { bg: "#EAF3DE", text: "#3B6D11" },
  cancelled:  { bg: "#FCEBEB", text: "#A32D2D" },
};

const statusLabels: Record<string, string> = {
  pending: "Pending", accepted: "Accepted", picked_up: "Picked up",
  on_the_way: "On the way", delivered: "Delivered", cancelled: "Cancelled",
};

const nextStatus: Record<string, OrderStatus> = {
  pending: "accepted",
  accepted: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered",
};

const allStatuses = ["all", "pending", "accepted", "picked_up", "on_the_way", "delivered", "cancelled"];

function AdminOrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          } as Order;
        })
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleAdvance(orderId: string, current: OrderStatus) {
    const next = nextStatus[current];
    if (!next) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, next);
      toast.success(`→ ${statusLabels[next]}`);
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Cancel this order?")) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, "cancelled");
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.customerPhone.includes(q) ||
        o.serviceType.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });

  const counts = allStatuses.reduce((acc, s) => {
    acc[s] = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/admin")} style={backBtnStyle}>← Dashboard</button>
          <span style={logoStyle}>sasa<span style={{ color: "#E8A020" }}>now</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Orders</span>
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {filtered.length} of {orders.length} orders
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Search + filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, service, description..."
            style={{
              flex: 1, minWidth: 220, padding: "10px 16px", borderRadius: 10,
              border: "1.5px solid rgba(0,0,0,0.12)", fontSize: 14,
              fontFamily: "var(--font-dm)", background: "#fff", outline: "none",
            }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 14px", borderRadius: 20,
                border: filter === s ? "2px solid #E8A020" : "1.5px solid rgba(0,0,0,0.1)",
                background: filter === s ? "#FEF3DC" : "#fff",
                fontFamily: "var(--font-dm)", fontSize: 12,
                fontWeight: filter === s ? 600 : 400,
                color: filter === s ? "#854F0B" : "#6B6A65",
                cursor: "pointer",
              }}
            >
              {s === "all" ? "All" : statusLabels[s]} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Orders table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 180px 120px", gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
            {["Order", "Status", "Amount", "Date", "Actions"].map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-dm)", fontSize: 11, fontWeight: 500, color: "#9B9A95", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)" }}>No orders found</div>
          ) : (
            filtered.map((order, i) => {
              const sc = statusColors[order.status] || statusColors.pending;
              const next = nextStatus[order.status];
              const isUpdating = updatingId === order.id;
              return (
                <div
                  key={order.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 100px 180px 120px",
                    gap: 0,
                    padding: "14px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    alignItems: "center",
                  }}
                >
                  {/* Order info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 14, color: "#111210" }}>{order.serviceType}</span>
                    </div>
                    <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65", marginBottom: 1 }}>
                      {order.description.slice(0, 50)}{order.description.length > 50 ? "..." : ""}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#9B9A95" }}>
                      {order.customerPhone} · {order.id.slice(0, 8)}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, fontFamily: "var(--font-dm)", whiteSpace: "nowrap" }}>
                      {statusLabels[order.status]}
                    </span>
                    {order.paid && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ background: "#EAF3DE", color: "#27500A", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, fontFamily: "var(--font-dm)" }}>✓ Paid</span>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 15, color: "#111210" }}>
                      {order.amountKes.toLocaleString()}
                    </span>
                    <p style={{ fontFamily: "var(--font-dm)", fontSize: 10, color: "#9B9A95" }}>KES</p>
                  </div>

                  {/* Date */}
                  <div>
                    <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65" }}>
                      {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#9B9A95" }}>
                      {order.createdAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {next && (
                      <button
                        onClick={() => handleAdvance(order.id, order.status)}
                        disabled={isUpdating}
                        style={{
                          padding: "5px 10px", borderRadius: 7, border: "none",
                          background: isUpdating ? "#F5C97A" : "#E8A020",
                          fontFamily: "var(--font-dm)", fontSize: 11, fontWeight: 600,
                          color: "#111210", cursor: isUpdating ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isUpdating ? "..." : `→ ${statusLabels[next].split(" ")[0]}`}
                      </button>
                    )}
                    {!["delivered", "cancelled"].includes(order.status) && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={isUpdating}
                        style={{
                          padding: "5px 10px", borderRadius: 7,
                          border: "1px solid rgba(162,45,45,0.2)",
                          background: "transparent",
                          fontFamily: "var(--font-dm)", fontSize: 11,
                          color: "#A32D2D", cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  background: "#111210", padding: "0 24px", height: 60,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  position: "sticky", top: 0, zIndex: 50,
};
const backBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", fontFamily: "var(--font-dm)",
  fontSize: 14, color: "rgba(255,255,255,0.6)", cursor: "pointer",
};
const logoStyle: React.CSSProperties = {
  fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 800, color: "#fff",
};

export default function AdminOrdersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminOrdersContent />
    </AuthGuard>
  );
}
