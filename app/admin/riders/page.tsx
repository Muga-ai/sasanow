"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Rider } from "@/types";
import toast from "react-hot-toast";

function AdminRidersContent() {
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("+254");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "riders"), (snap) => {
      setRiders(snap.docs.map((d) => d.data() as Rider));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleToggleAvailable(rider: Rider) {
    try {
      await updateDoc(doc(db, "riders", rider.uid), {
        isAvailable: !rider.isAvailable,
      });
      toast.success(`${rider.name} marked as ${!rider.isAvailable ? "available" : "unavailable"}`);
    } catch {
      toast.error("Failed to update rider");
    }
  }

  async function handleToggleOnline(rider: Rider) {
    try {
      await updateDoc(doc(db, "riders", rider.uid), {
        isOnline: !rider.isOnline,
        isAvailable: !rider.isOnline ? rider.isAvailable : false,
      });
      toast.success(`${rider.name} is now ${!rider.isOnline ? "online" : "offline"}`);
    } catch {
      toast.error("Failed to update rider");
    }
  }

  async function handleAddRider() {
    if (!newName.trim()) return toast.error("Enter rider name");
    if (newPhone.replace(/\D/g, "").length < 12) return toast.error("Enter valid phone number");

    setAdding(true);
    try {
      const uid = `rider_${Date.now()}`;
      const rider: Rider = {
        uid,
        name: newName.trim(),
        phone: newPhone.trim(),
        isOnline: false,
        isAvailable: false,
        totalDeliveries: 0,
        rating: 5.0,
      };
      await setDoc(doc(db, "riders", uid), rider);
      toast.success(`${newName} added as a rider`);
      setNewName("");
      setNewPhone("+254");
      setShowAdd(false);
    } catch {
      toast.error("Failed to add rider");
    } finally {
      setAdding(false);
    }
  }

  const onlineRiders = riders.filter((r) => r.isOnline);
  const availableRiders = riders.filter((r) => r.isOnline && r.isAvailable);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/admin")} style={backBtnStyle}>← Dashboard</button>
          <span style={logoStyle}>
            sasa<span style={{ color: "#E8A020" }}>now</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Riders</span>
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: "#E8A020", border: "none", borderRadius: 8,
            padding: "8px 16px", fontFamily: "var(--font-dm)", fontSize: 13,
            fontWeight: 600, color: "#111210", cursor: "pointer",
          }}
        >
          + Add rider
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total riders", value: riders.length },
            { label: "Online now", value: onlineRiders.length, color: "#1F6B3A" },
            { label: "Available", value: availableRiders.length, color: "#185FA5" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", padding: "16px 20px" }}>
              <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 26, color: s.color || "#111210" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add rider form */}
        {showAdd && (
          <div style={{ background: "#fff", borderRadius: 14, border: "2px solid #E8A020", padding: "20px 24px", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 16, color: "#111210", marginBottom: 16 }}>Add new rider</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                style={inputStyle}
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                style={inputStyle}
              />
              <button
                onClick={handleAddRider}
                disabled={adding}
                style={{
                  padding: "11px 24px", borderRadius: 10, border: "none",
                  background: adding ? "#F5C97A" : "#E8A020",
                  fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14,
                  color: "#111210", cursor: adding ? "not-allowed" : "pointer",
                }}
              >
                {adding ? "Adding..." : "Add rider"}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                style={{ padding: "11px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "transparent", fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Riders list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#9B9A95", fontFamily: "var(--font-dm)" }}>Loading riders...</div>
        ) : riders.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "64px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏍️</div>
            <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#111210", marginBottom: 8 }}>No riders yet</p>
            <p style={{ fontFamily: "var(--font-dm)", fontSize: 14, color: "#6B6A65", marginBottom: 20 }}>Add your first rider to start dispatching orders</p>
            <button onClick={() => setShowAdd(true)} style={{ background: "#E8A020", border: "none", borderRadius: 10, padding: "12px 28px", fontFamily: "var(--font-dm)", fontWeight: 600, fontSize: 14, color: "#111210", cursor: "pointer" }}>
              + Add first rider
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {riders
              .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))
              .map((rider) => (
                <div
                  key={rider.uid}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    border: rider.isOnline ? "1.5px solid #1F6B3A" : "1px solid rgba(0,0,0,0.07)",
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Avatar + status dot */}
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: rider.isOnline ? "#E6F5ED" : "#F1EFE8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18,
                      color: rider.isOnline ? "#0F6E56" : "#888780",
                    }}>
                      {rider.name.charAt(0)}
                    </div>
                    <div style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 12, height: 12, borderRadius: "50%",
                      background: rider.isOnline ? "#1F6B3A" : "#B4B2A9",
                      border: "2px solid #fff",
                    }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 15, color: "#111210", marginBottom: 2 }}>{rider.name}</p>
                    <p style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "#6B6A65" }}>{rider.phone}</p>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 20, textAlign: "center" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18, color: "#111210" }}>{rider.totalDeliveries}</p>
                      <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95" }}>deliveries</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18, color: "#111210" }}>{rider.rating.toFixed(1)}</p>
                      <p style={{ fontFamily: "var(--font-dm)", fontSize: 11, color: "#9B9A95" }}>rating</p>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleToggleOnline(rider)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, border: "none",
                        background: rider.isOnline ? "#E6F5ED" : "#F1EFE8",
                        fontFamily: "var(--font-dm)", fontSize: 12, fontWeight: 600,
                        color: rider.isOnline ? "#0F6E56" : "#888780",
                        cursor: "pointer",
                      }}
                    >
                      {rider.isOnline ? "● Online" : "○ Offline"}
                    </button>
                    {rider.isOnline && (
                      <button
                        onClick={() => handleToggleAvailable(rider)}
                        style={{
                          padding: "7px 14px", borderRadius: 8, border: "none",
                          background: rider.isAvailable ? "#EEEDFE" : "#FEF3DC",
                          fontFamily: "var(--font-dm)", fontSize: 12, fontWeight: 600,
                          color: rider.isAvailable ? "#534AB7" : "#854F0B",
                          cursor: "pointer",
                        }}
                      >
                        {rider.isAvailable ? "Available" : "Busy"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
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
const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 180, padding: "11px 16px", borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,0.12)", fontSize: 14,
  fontFamily: "var(--font-dm)", color: "#111210", outline: "none",
  background: "#FAFAF8",
};

export default function AdminRidersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminRidersContent />
    </AuthGuard>
  );
}
