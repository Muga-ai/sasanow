"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SasaUser } from "@/types";

function AdminUsersContent() {
  const router = useRouter();
  const [users, setUsers] = useState<SasaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), orderBy("createdAt", "desc"))
        );
        setUsers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
            } as SasaUser;
          })
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.uid?.includes(q)
    );
  });

  const customers = users.filter((u) => u.role === "customer");
  const riders = users.filter((u) => u.role === "rider");
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      {/* Nav */}
      <nav style={{ background: "#111210", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/admin")} style={{ background: "transparent", border: "none", fontFamily: "var(--font-dm)", fontSize: 14, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            ← Dashboard
          </button>
          <span style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 800, color: "#fff" }}>
            sasa<span style={{ color: "#E8A020" }}>now</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Users</span>
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {filtered.length} users
        </span>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Customers", value: customers.length, color: "#111210" },
            { label: "Riders", value: riders.length, color: "#1F6B3A" },
            { label: "Admins", value: admins.length, color: "#534AB7" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", padding: "16px 20px" }}>
              <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#6B6A65", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or UID..."
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10,
            border: "1.5px solid rgba(0,0,0,0.12)", fontSize: 14,
            fontFamily: "var(--font-dm)", background: "#fff", outline: "none",
            marginBottom: 16, boxSizing: "border-box",
          }}
        />

        {/* Users list */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 140px", padding: "10px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
            {["User", "Phone", "Role", "Joined"].map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-dm)", fontSize: 11, fontWeight: 500, color: "#9B9A95", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)" }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9B9A95", fontFamily: "var(--font-dm)" }}>No users found</div>
          ) : (
            filtered.map((user, i) => {
              const roleColor = user.role === "admin" ? { bg: "#EEEDFE", text: "#534AB7" } :
                user.role === "rider" ? { bg: "#E6F5ED", text: "#0F6E56" } :
                { bg: "#F1EFE8", text: "#5F5E5A" };

              return (
                <div
                  key={user.uid}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 100px 140px",
                    padding: "14px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#FEF3DC", display: "flex", alignItems: "center",
                      justifyContent: "center", fontFamily: "var(--font-syne)",
                      fontWeight: 800, fontSize: 14, color: "#854F0B", flexShrink: 0,
                    }}>
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-dm)", fontWeight: 500, fontSize: 14, color: "#111210" }}>{user.name || "—"}</p>
                      <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#9B9A95" }}>{user.uid.slice(0, 14)}...</p>
                    </div>
                  </div>

                  <p style={{ fontFamily: "var(--font-dm)", fontSize: 13, color: "#6B6A65" }}>{user.phone}</p>

                  <span style={{
                    background: roleColor.bg, color: roleColor.text,
                    fontSize: 11, fontWeight: 500, padding: "3px 10px",
                    borderRadius: 20, fontFamily: "var(--font-dm)",
                    display: "inline-block", width: "fit-content",
                  }}>
                    {user.role}
                  </span>

                  <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#9B9A95" }}>
                    {user.createdAt instanceof Date
                      ? user.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminUsersContent />
    </AuthGuard>
  );
}
