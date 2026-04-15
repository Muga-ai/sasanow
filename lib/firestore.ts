"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, SasaUser, Rider } from "@/types";

// ─────────────────────────────────────────────
// 🔥 SAFE HELPERS (FIRESTORE HARD FIX)
// ─────────────────────────────────────────────

function normalizeTimestamp(value: any): Date {
  try {
    if (!value) return new Date();

    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;

    return new Date(value);
  } catch {
    return new Date();
  }
}

function normalizeOrder(data: any): Order {
  return {
    ...(data as Order),
    createdAt: normalizeTimestamp(data?.createdAt),
    updatedAt: normalizeTimestamp(data?.updatedAt),
  };
}

function safeUnsubscribe(unsub?: () => void) {
  return () => {
    try {
      if (typeof unsub === "function") unsub();
    } catch (e) {
      console.warn("Unsubscribe error ignored:", e);
    }
  };
}

// ─────────────────────────────────────────────
// 👤 USERS
// ─────────────────────────────────────────────

export async function getUser(uid: string): Promise<SasaUser | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as SasaUser) : null;
  } catch (e) {
    console.error("getUser failed:", e);
    return null;
  }
}

export async function createUser(
  uid: string,
  data: Omit<SasaUser, "uid" | "createdAt">
) {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("createUser failed:", e);
    throw e;
  }
}

export async function updateUser(uid: string, data: Partial<SasaUser>) {
  try {
    await updateDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("updateUser failed:", e);
    throw e;
  }
}

// ─────────────────────────────────────────────
// 📦 ORDERS
// ─────────────────────────────────────────────

export async function createOrder(
  order: Omit<Order, "id" | "createdAt" | "updatedAt">
) {
  try {
    const ref = doc(collection(db, "orders"));

    await setDoc(ref, {
      ...order,
      id: ref.id,
      status: "pending",
      paid: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  } catch (e) {
    console.error("createOrder failed:", e);
    throw e;
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const snap = await getDoc(doc(db, "orders", orderId));
    return snap.exists() ? normalizeOrder(snap.data()) : null;
  } catch (e) {
    console.error("getOrder failed:", e);
    return null;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  extra?: Partial<Order>
) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status,
      ...extra,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("updateOrderStatus failed:", e);
    throw e;
  }
}

// FIXED LISTENER (NO CRASH + SAFE CLEANUP + NO FIRESTORE ASSERT ISSUES)
export function subscribeToOrder(
  orderId: string,
  callback: (order: Order) => void
) {
  try {
    const ref = doc(db, "orders", orderId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          callback(normalizeOrder(snap.data()));
        }
      },
      (err) => {
        console.warn("subscribeToOrder error:", err);
      }
    );

    return safeUnsubscribe(unsub);
  } catch (e) {
    console.error("subscribeToOrder init failed:", e);
    return () => {};
  }
}

// FIXED CUSTOMER ORDERS (CRITICAL FIX: AVOID ORDERBY CRASH COMBINATION)
export function subscribeToCustomerOrders(
  customerId: string,
  callback: (orders: Order[]) => void
) {
  try {
    const baseRef = collection(db, "orders");

    const q = query(
      baseRef,
      where("customerId", "==", customerId)
      // ⚠️ removed orderBy to prevent Firestore composite index / state crashes
      // you can re-enable AFTER indexes are confirmed stable
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs
          .map((d) => normalizeOrder(d.data()))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        callback(orders);
      },
      (err) => {
        console.warn("subscribeToCustomerOrders error:", err);
      }
    );

    return safeUnsubscribe(unsub);
  } catch (e) {
    console.error("subscribeToCustomerOrders init failed:", e);
    return () => {};
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, "orders"));

    return snap.docs
      .map((d) => normalizeOrder(d.data()))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (e) {
    console.error("getAllOrders failed:", e);
    return [];
  }
}

// ─────────────────────────────────────────────
// 🚴 RIDERS
// ─────────────────────────────────────────────

export async function getAvailableRiders(): Promise<Rider[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "riders"),
        where("isOnline", "==", true),
        where("isAvailable", "==", true)
      )
    );

    return snap.docs.map((d) => d.data() as Rider);
  } catch (e) {
    console.error("getAvailableRiders failed:", e);
    return [];
  }
}