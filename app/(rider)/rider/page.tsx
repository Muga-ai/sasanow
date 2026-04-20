"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, orderBy, getDoc,
} from "firebase/firestore";
import { updateOrderStatus } from "@/lib/firestore";
import type { Order } from "@/types";
import toast from "react-hot-toast";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "#FEF3DC", text: "#854F0B",  label: "Available to accept" },
  accepted:   { bg: "#E6F5ED", text: "#0F6E56",  label: "Accepted" },
  picked_up:  { bg: "#E6F1FB", text: "#185FA5",  label: "Picked up" },
  on_the_way: { bg: "#EEEDFE", text: "#534AB7",  label: "On the way" },
  delivered:  { bg: "#EAF3DE", text: "#3B6D11",  label: "Delivered" },
  cancelled:  { bg: "#FCEBEB", text: "#A32D2D",  label: "Cancelled" },
};

function safeDate(value: any): Date {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  return new Date(value);
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function RiderDashboardContent() {
  const { sasaUser, firebaseUser } = useAuth();
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"available" | "mine" | "history">("available");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const unsubPendingRef = useRef<(() => void) | null>(null);
  const unsubMineRef = useRef<(() => void) | null>(null);

  const firstName = sasaUser?.name?.split(" ")[0] || "Rider";

  // Load rider online status from Firestore
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = onSnapshot(doc(db, "riders", firebaseUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsOnline(data.isOnline ?? false);
        setIsAvailable(data.isAvailable ?? false);
      }
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // Subscribe to pending orders (available to accept)
  useEffect(() => {
    if (!isOnline) {
      setPendingOrders([]);
      return;
    }

    if (unsubPendingRef.current) unsubPendingRef.current();

    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      where("paid", "==", true),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingOrders(
        snap.docs.map((d) => {
          const data = d.data();
          return { ...data, createdAt: safeDate(data.createdAt), updatedAt: safeDate(data.updatedAt) } as Order;
        })
      );
    });

    unsubPendingRef.current = unsub;
    return () => unsub();
  }, [isOnline]);

  // Subscribe to this rider's own orders
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    if (unsubMineRef.current) unsubMineRef.current();

    const q = query(
      collection(db, "orders"),
      where("riderId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMyOrders(
        snap.docs.map((d) => {
          const data = d.data();
          return { ...data, createdAt: safeDate(data.createdAt), updatedAt: safeDate(data.updatedAt) } as Order;
        })
      );
    });

    unsubMineRef.current = unsub;
    return () => unsub();
  }, [firebaseUser?.uid]);

  async function toggleOnline() {
    if (!firebaseUser?.uid) return;
    setTogglingOnline(true);
    try {
      const newOnline = !isOnline;
      await updateDoc(doc(db, "riders", firebaseUser.uid), {
        isOnline: newOnline,
        isAvailable: newOnline ? true : false,
      });
      toast.success(newOnline ? "You're online — orders will appear now" : "You're offline");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setTogglingOnline(false);
    }
  }

  async function acceptOrder(order: Order) {
    if (!firebaseUser?.uid || !sasaUser) return;
    setAccepting(order.id);
    try {
      await updateOrderStatus(order.id, "accepted", {
        riderId: firebaseUser.uid,
        riderName: sasaUser.name,
      });
      // Mark rider as busy
      await updateDoc(doc(db, "riders", firebaseUser.uid), {
        isAvailable: false,
        currentOrderId: order.id,
      });
      toast.success("Order accepted! Head to pickup.");
      setTab("mine");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept order");
    } finally {
      setAccepting(null);
    }
  }

  async function advanceOrder(order: Order) {
    const next: Record<string, Order["status"]> = {
      accepted:   "picked_up",
      picked_up:  "on_the_way",
      on_the_way: "delivered",
    };
    const nextStatus = next[order.status];
    if (!nextStatus || !firebaseUser?.uid) return;

    setAdvancing(order.id);
    try {
      await updateOrderStatus(order.id, nextStatus);

      if (nextStatus === "delivered") {
        // Mark rider available again, increment delivery count
        const riderRef = doc(db, "riders", firebaseUser.uid);
        const riderSnap = await getDoc(riderRef);
        const total = riderSnap.exists() ? (riderSnap.data().totalDeliveries || 0) + 1 : 1;
        await updateDoc(riderRef, {
          isAvailable: true,
          currentOrderId: null,
          totalDeliveries: total,
        });
        toast.success("Order delivered! Great work 🎉");
      } else {
        const labels: Record<string, string> = {
          picked_up: "Marked as picked up",
          on_the_way: "On the way to customer",
        };
        toast.success(labels[nextStatus] || "Status updated");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setAdvancing(null);
    }
  }

  async function handleSignOut() {
    if (firebaseUser?.uid) {
      await updateDoc(doc(db, "riders", firebaseUser.uid), {
        isOnline: false,
        isAvailable: false,
      }).catch(() => {});
    }
    await signOut(auth);
    router.replace("/login");
  }

  const activeMyOrders = myOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const historyOrders = myOrders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  const nextStatusLabel: Record<string, string> = {
    accepted:   "Confirm pickup →",
    picked_up:  "Mark on the way →",
    on_the_way: "Mark as delivered ✓",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* Nav */}
      <nav style={{ height: 60, background: "#111210", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 800, color: "#fff" }}>
          sasa<span style={{ color: "#E8A020" }}>now</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Rider</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleSignOut}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: "var(--font-dm)", fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Greeting + online toggle */}
        <div
          style={{
            background: isOnline ? "#111210" : "#fff",
            borderRadius: 16,
            border: isOnline ? "none" : "1px solid rgba(0,0,0,0.07)",
            padding: "20px",
            marginBottom: 20,
            transition: "background 0.3s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 20, color: isOnline ? "#fff" : "#111210", marginBottom: 4 }}>
                Habari, {firstName} 👋
              </p>
              <p style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: isOnline ? "rgba(255,255,255,0.5)" : "#6B6A65" }}>
                {isOnline
                  ? `Online · ${pendingOrders.length} order${pendingOrders.length !== 1 ? "s" : ""} available`
                  : "You're offline — go online to receive orders"}
              </p>
            </div>

            <button
              onClick={toggleOnline}
              disabled={togglingOnline}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: isOnline ? "#E8A020" : "#1F6B3A",
                fontFamily: "var(--font-dm)",
                fontWeight: 600,
                fontSize: 14,
                color: isOnline ? "#111210" : "#fff",
                cursor: togglingOnline ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: togglingOnline ? 0.7 : 1,
              }}
            >
              {togglingOnline ? "..." : isOnline ? "Go offline" : "Go online"}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${isOnline ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}` }}>
            {[
              { label: "Active orders", value: activeMyOrders.length },
              { label: "Completed", value: historyOrders.filter(o => o.status === "delivered").length },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 22, color: isOnline ? "#fff" : "#111210" }}>{s.value}</p>
                <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: isOnline ? "rgba(255,255,255,0.4)" : "#9B9A95" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", padding: 4, marginBottom: 16 }}>
          {([
            { key: "available", label: "Available", count: isOnline ? pendingOrders.length : 0 },
            { key: "mine", label: "My orders", count: activeMyOrders.length },
            { key: "history", label: "History", count: 0 },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "9px 4px", borderRadius: 8, border: "none",
                background: tab === t.key ? "#111210" : "transparent",
                fontFamily: "var(--font-dm)", fontSize: 13,
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? "#fff" : "#6B6A65",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{ marginLeft: 5, background: "#E8A020", color: "#111210", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Available orders */}
        {tab === "available" && (
          <div>
            {!isOnline ? (
              <Empty icon="🏍️" title="You're offline" sub="Go online above to see available orders" />
            ) : pendingOrders.length === 0 ? (
              <Empty icon="👀" title="No orders yet" sub="New orders will appear here in real time" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8A020", padding: "16px 18px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 15, color: "#111210", marginBottom: 2 }}>
                          {order.serviceType}
                        </p>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65" }}>
                          {order.description.slice(0, 60)}{order.description.length > 60 ? "..." : ""}
                        </p>
                      </div>
                      <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 16, color: "#1F6B3A", flexShrink: 0, marginLeft: 12 }}>
                        KES {order.amountKes.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 12, fontFamily: "var(--font-dm)" }}>
                      <div style={{ background: "#F8F6F1", borderRadius: 8, padding: "8px 10px" }}>
                        <p style={{ color: "#9B9A95", marginBottom: 2 }}>Pickup</p>
                        <p style={{ color: "#111210", fontWeight: 500 }}>{order.pickupAddress}</p>
                      </div>
                      <div style={{ background: "#F8F6F1", borderRadius: 8, padding: "8px 10px" }}>
                        <p style={{ color: "#9B9A95", marginBottom: 2 }}>Deliver to</p>
                        <p style={{ color: "#111210", fontWeight: 500 }}>{order.dropoffAddress}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95" }}>
                        {timeAgo(order.createdAt)}
                      </p>
                      <button
                        onClick={() => acceptOrder(order)}
                        disabled={accepting === order.id}
                        style={{
                          padding: "9px 20px", borderRadius: 9, border: "none",
                          background: accepting === order.id ? "#F5C97A" : "#E8A020",
                          fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14,
                          color: "#111210", cursor: accepting === order.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {accepting === order.id ? "Accepting..." : "Accept order →"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My active orders */}
        {tab === "mine" && (
          <div>
            {activeMyOrders.length === 0 ? (
              <Empty icon="📦" title="No active orders" sub="Accept an order from the Available tab" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeMyOrders.map((order) => {
                  const sc = statusColors[order.status];
                  const nextLabel = nextStatusLabel[order.status];
                  return (
                    <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <p style={{ fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 15, color: "#111210", marginBottom: 2 }}>{order.serviceType}</p>
                          <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65" }}>
                            {order.description.slice(0, 55)}{order.description.length > 55 ? "..." : ""}
                          </p>
                        </div>
                        <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: "var(--font-dm)", whiteSpace: "nowrap", height: "fit-content", marginLeft: 10 }}>
                          {sc.label}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 12, fontFamily: "var(--font-dm)" }}>
                        <div style={{ background: "#F8F6F1", borderRadius: 8, padding: "8px 10px" }}>
                          <p style={{ color: "#9B9A95", marginBottom: 2 }}>Pickup</p>
                          <p style={{ color: "#111210", fontWeight: 500 }}>{order.pickupAddress}</p>
                        </div>
                        <div style={{ background: "#F8F6F1", borderRadius: 8, padding: "8px 10px" }}>
                          <p style={{ color: "#9B9A95", marginBottom: 2 }}>Deliver to</p>
                          <p style={{ color: "#111210", fontWeight: 500 }}>{order.dropoffAddress}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 15, color: "#111210" }}>
                          KES {order.amountKes.toLocaleString()}
                        </p>
                        {nextLabel && (
                          <button
                            onClick={() => advanceOrder(order)}
                            disabled={advancing === order.id}
                            style={{
                              padding: "9px 16px", borderRadius: 9, border: "none",
                              background: order.status === "on_the_way" ? "#1F6B3A" : "#111210",
                              fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 13,
                              color: "#fff", cursor: advancing === order.id ? "not-allowed" : "pointer",
                              opacity: advancing === order.id ? 0.7 : 1,
                            }}
                          >
                            {advancing === order.id ? "Updating..." : nextLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div>
            {historyOrders.length === 0 ? (
              <Empty icon="📋" title="No history yet" sub="Completed and cancelled orders appear here" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historyOrders.map((order) => {
                  const sc = statusColors[order.status];
                  return (
                    <div key={order.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 14, color: "#111210", marginBottom: 2 }}>{order.serviceType}</p>
                        <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95" }}>
                          {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, fontFamily: "var(--font-dm)", whiteSpace: "nowrap" }}>
                        {sc.label}
                      </span>
                      <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 14, color: "#111210", flexShrink: 0 }}>
                        KES {order.amountKes.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", padding: "52px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#111210", marginBottom: 6 }}>{title}</p>
      <p style={{ fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65" }}>{sub}</p>
    </div>
  );
}

export default function RiderDashboardPage() {
  return (
    <AuthGuard requiredRole="rider">
      <RiderDashboardContent />
    </AuthGuard>
  );
}
