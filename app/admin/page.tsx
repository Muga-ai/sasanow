 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import{ useAuth } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { getAllOrders, updateOrderStatus, getAvailableRiders } from "@/lib/firestore";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Order, Rider, OrderStatus } from "@/types";
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

const tabs = ["Overview", "Orders", "Riders"] as const;
type Tab = typeof tabs[number];

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "20px 22px" }}>
      <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 28, color: color || "#111210", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#9B9A95", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function AdminContent() {
  const { sasaUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Live order subscription
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        } as Order;
      });
      setOrders(raw);
      setLoadingOrders(false);
    });
    return () => unsub();
  }, []);

  // Riders
  useEffect(() => {
    getAvailableRiders().then(setRiders).catch(console.error);
  }, []);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order updated to "${statusLabels[status]}"`);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/");
  }

  // Derived stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.filter((o) => o.paid).reduce((sum, o) => sum + o.amountKes, 0);
  const activeOrders = orders.filter((o) => ["pending", "accepted", "picked_up", "on_the_way"].includes(o.status));
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* Nav */}
      <nav style={{ background: "#111210", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 800, color: "#fff" }}>
          sasa<span style={{ color: "#E8A020" }}>now</span>
          <span style={{ marginLeft: 10, fontSize: 11, fontFamily: "var(--font-dm)", fontWeight: 400, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {pendingOrders.length > 0 && (
            <div style={{ background: "#E8A020", color: "#111210", borderRadius: 20, padding: "4px 12px", fontFamily: "var(--font-dm)", fontSize: 13, fontWeight: 600 }}>
              {pendingOrders.length} pending
            </div>
          )}
          <button onClick={handleSignOut} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", fontFamily: "var(--font-dm)", fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "0 24px", display: "flex", gap: 0 }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "14px 20px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2.5px solid #E8A020" : "2.5px solid transparent",
              fontFamily: "var(--font-dm)",
              fontSize: 14,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#111210" : "#6B6A65",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t}
            {t === "Orders" && activeOrders.length > 0 && (
              <span style={{ marginLeft: 6, background: "#FEF3DC", color: "#854F0B", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10 }}>
                {activeOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ── OVERVIEW ────────────────────────────── */}
        {tab === "Overview" && (
          <div>
            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800, color: "#111210", marginBottom: 20 }}>
              Overview
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
              <StatCard label="Orders today" value={todayOrders.length} sub={`${activeOrders.length} active`} />
              <StatCard label="Revenue today" value={`KES ${todayRevenue.toLocaleString()}`} sub="Paid orders only" color="#1F6B3A" />
              <StatCard label="Pending" value={pendingOrders.length} sub="Awaiting rider" color={pendingOrders.length > 0 ? "#854F0B" : "#111210"} />
              <StatCard label="Total orders" value={orders.length} sub="All time" />
            </div>

            {/* Recent orders preview */}
            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 800, color: "#111210", marginBottom: 14 }}>
              Recent orders
            </h2>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
              {orders.slice(0, 6).map((order, i) => (
                <AdminOrderRow
                  key={order.id}
                  order={order}
                  isLast={i === Math.min(orders.length, 6) - 1}
                  onStatusChange={handleStatusChange}
                  updating={updatingId === order.id}
                />
              ))}
              {orders.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)", fontSize: 14 }}>
                  No orders yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ORDERS ──────────────────────────────── */}
        {tab === "Orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800, color: "#111210" }}>
                All orders
              </h1>
              {/* Filter */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["all", "pending", "accepted", "on_the_way", "delivered", "cancelled"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: filterStatus === s ? "2px solid #E8A020" : "1.5px solid rgba(0,0,0,0.1)",
                      background: filterStatus === s ? "#FEF3DC" : "#fff",
                      fontFamily: "var(--font-dm)",
                      fontSize: 12,
                      fontWeight: filterStatus === s ? 600 : 400,
                      color: filterStatus === s ? "#854F0B" : "#6B6A65",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s === "all" ? "All" : statusLabels[s]}
                    {s !== "all" && (
                      <span style={{ marginLeft: 5, opacity: 0.6 }}>
                        ({orders.filter((o) => o.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
              {loadingOrders ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)", fontSize: 14 }}>
                  Loading orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)", fontSize: 14 }}>
                  No orders with this status
                </div>
              ) : (
                filteredOrders.map((order, i) => (
                  <AdminOrderRow
                    key={order.id}
                    order={order}
                    isLast={i === filteredOrders.length - 1}
                    onStatusChange={handleStatusChange}
                    updating={updatingId === order.id}
                    showPhone
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── RIDERS ──────────────────────────────── */}
        {tab === "Riders" && (
          <div>
            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800, color: "#111210", marginBottom: 20 }}>
              Riders
            </h1>
            {riders.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏍️</div>
                <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#111210", marginBottom: 6 }}>
                  No riders online
                </p>
                <p style={{ fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65" }}>
                  Riders will appear here when they go online via the rider app
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {riders.map((rider) => (
                  <div key={rider.uid} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E6F5ED", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 16, color: "#0F6E56" }}>
                        {rider.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 15, color: "#111210" }}>{rider.name}</p>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "#6B6A65" }}>{rider.phone}</p>
                      </div>
                      <div style={{ marginLeft: "auto", width: 10, height: 10, borderRadius: "50%", background: rider.isAvailable ? "#1F6B3A" : "#E8A020" }} />
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deliveries</p>
                        <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18, color: "#111210" }}>{rider.totalDeliveries}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rating</p>
                        <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18, color: "#111210" }}>{rider.rating.toFixed(1)} ⭐</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</p>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 13, fontWeight: 500, color: rider.isAvailable ? "#1F6B3A" : "#854F0B" }}>
                          {rider.isAvailable ? "Available" : "On delivery"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function AdminOrderRow({
  order, isLast, onStatusChange, updating, showPhone,
}: {
  order: Order;
  isLast: boolean;
  onStatusChange: (id: string, status: OrderStatus) => void;
  updating: boolean;
  showPhone?: boolean;
}) {
  const status = statusColors[order.status] || statusColors.pending;
  const nextStatuses: Record<string, OrderStatus> = {
    pending: "accepted",
    accepted: "picked_up",
    picked_up: "on_the_way",
    on_the_way: "delivered",
  };
  const next = nextStatuses[order.status];

  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <p style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 14, color: "#111210" }}>
            {order.serviceType}
          </p>
          <span style={{ background: status.bg, color: status.text, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, fontFamily: "var(--font-dm)", whiteSpace: "nowrap" }}>
            {statusLabels[order.status]}
          </span>
        </div>
        <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65" }}>
          {order.description.slice(0, 55)}{order.description.length > 55 ? "..." : ""}
        </p>
        {showPhone && (
          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#9B9A95", marginTop: 2 }}>
            {order.customerPhone}
          </p>
        )}
      </div>

      <div style={{ textAlign: "right", minWidth: 100 }}>
        <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 15, color: "#111210" }}>
          KES {order.amountKes.toLocaleString()}
        </p>
        <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95" }}>
          {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {next && (
        <button
          onClick={() => onStatusChange(order.id, next)}
          disabled={updating}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: updating ? "#F5C97A" : "#E8A020",
            fontFamily: "var(--font-dm)",
            fontSize: 12,
            fontWeight: 600,
            color: "#111210",
            cursor: updating ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {updating ? "..." : `→ ${statusLabels[next]}`}
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminContent />
    </AuthGuard>
  );
}
