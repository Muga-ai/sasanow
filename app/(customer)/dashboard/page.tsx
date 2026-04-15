"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { subscribeToCustomerOrders } from "@/lib/firestore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Order } from "@/types";
import toast from "react-hot-toast";

const services = [
  { icon: "🛒", label: "Groceries", sub: "Supermarkets & mama mbogas", color: "#FEF3DC" },
  { icon: "💊", label: "Pharmacy", sub: "Medicine & health", color: "#E6F5ED" },
  { icon: "🏃", label: "Errands", sub: "Bills, docs, queues", color: "#EEEDFE" },
  { icon: "🍖", label: "Food", sub: "Restaurants & local joints", color: "#FAECE7" },
  { icon: "🔧", label: "Home Services", sub: "Plumber, electrician", color: "#E6F1FB" },
  { icon: "💈", label: "Beauty", sub: "Barber, nails, massage", color: "#FBEAF0" },
  { icon: "🚗", label: "Auto", sub: "Fuel, car wash, mechanic", color: "#F1EFE8" },
  { icon: "🐾", label: "Pets", sub: "Food, vet, grooming", color: "#E1F5EE" },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#FEF3DC", text: "#854F0B", label: "Finding rider..." },
  accepted: { bg: "#E6F5ED", text: "#0F6E56", label: "Rider assigned" },
  picked_up: { bg: "#E6F1FB", text: "#185FA5", label: "Picked up" },
  on_the_way: { bg: "#EEEDFE", text: "#534AB7", label: "On the way" },
  delivered: { bg: "#EAF3DE", text: "#3B6D11", label: "Delivered" },
  cancelled: { bg: "#FCEBEB", text: "#A32D2D", label: "Cancelled" },
};

function safeDate(value: any) {
  const d = value?.toDate?.() || value;
  return d ? new Date(d) : new Date();
}

/* ───────────────────────────────────────────── */
/* ORDER CARD (STABLE + FAST RENDER) */
/* ───────────────────────────────────────────── */

const OrderCard = ({ order }: { order: Order }) => {
  const router = useRouter();

  const status = statusColors[order.status] || statusColors.pending;

  const createdAt = useMemo(() => safeDate(order.createdAt), [order.createdAt]);

  const desc = order.description || "";

  return (
    <div
      onClick={() => router.push(`/orders/${order.id}`)}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.06)",
        padding: 16,
        cursor: "pointer",
        transition: "all 0.15s ease",
        willChange: "transform",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "none";
        el.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
            {order.serviceType}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#6B6A65",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 260,
            }}
          >
            {desc}
          </p>
        </div>

        <span
          style={{
            background: status.bg,
            color: status.text,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
            height: "fit-content",
            whiteSpace: "nowrap",
          }}
        >
          {status.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          alignItems: "center",
        }}
      >
        <p style={{ fontSize: 12, color: "#999" }}>
          {createdAt.toLocaleString("en-KE", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <p style={{ fontWeight: 700, fontSize: 14 }}>
          KES {(order.amountKes || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────── */
/* DASHBOARD */
/* ───────────────────────────────────────────── */

function DashboardContent() {
  const { sasaUser, firebaseUser } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const unsubRef = useRef<null | (() => void)>(null);

  /* CLEAN REALTIME SUBSCRIPTION (NO MEMORY LEAKS / NO DOUBLE LISTENERS) */
  useEffect(() => {
    if (!firebaseUser?.uid) return;

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const unsub = subscribeToCustomerOrders(firebaseUser.uid, (data) => {
      setOrders(data || []);
    });

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [firebaseUser?.uid]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setOrders([]);
      toast.success("Signed out");
      router.replace("/login");
    } catch (e) {
      toast.error("Sign out failed");
    }
  }, [router]);

  const firstName = useMemo(() => {
    return sasaUser?.name?.split(" ")[0] || "there";
  }, [sasaUser?.name]);

  const activeOrders = useMemo(
    () => orders.filter((o) => !["delivered", "cancelled"].includes(o.status)),
    [orders]
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* NAV */}
      <nav
        style={{
          height: 60,
          background: "#fff",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 18 }}>
          sasa<span style={{ color: "#E8A020" }}>now</span>
        </span>

        <button
          onClick={handleSignOut}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "#FEF3DC",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {firstName.charAt(0).toUpperCase()}
        </button>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        {/* GREETING */}
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          Habari, {firstName} 👋
        </h1>
        <p style={{ color: "#666", marginBottom: 20 }}>
          What do you need delivered sasa?
        </p>

        {/* ACTIVE ORDERS */}
        {activeOrders.length > 0 && (
          <div
            onClick={() => router.push(`/orders/${activeOrders[0].id}`)}
            style={{
              background: "#E8A020",
              padding: 14,
              borderRadius: 14,
              marginBottom: 20,
              cursor: "pointer",
            }}
          >
            <b>
              {activeOrders.length} active order
              {activeOrders.length > 1 ? "s" : ""}
            </b>
            <p style={{ fontSize: 13 }}>
              {statusColors[activeOrders[0].status]?.label}
            </p>
          </div>
        )}

        {/* SERVICES */}
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>Services</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {services.map((s) => (
            <div
              key={s.label}
              onClick={() =>
                router.push(`/checkout?service=${encodeURIComponent(s.label)}`)
              }
              style={{
                background:
                  selectedService === s.label ? "#E8A020" : "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 12,
                padding: 12,
                textAlign: "center",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "#E8A020";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(0,0,0,0.06)";
              }}
            >
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <p style={{ fontSize: 12 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ORDERS */}
        {orders.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>Your orders</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.slice(0, 10).map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          </>
        )}

        {/* EMPTY */}
        {orders.length === 0 && (
          <div
            style={{
              background: "#fff",
              padding: 30,
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <p>No orders yet</p>
            <button
              onClick={() => router.push("/checkout")}
              style={{
                marginTop: 10,
                padding: "10px 18px",
                borderRadius: 10,
                background: "#E8A020",
                border: "none",
                cursor: "pointer",
              }}
            >
              Place order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="customer">
      <DashboardContent />
    </AuthGuard>
  );
}