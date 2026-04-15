import { NextRequest, NextResponse } from "next/server";
import { createOrder, getUser } from "@/lib/firestore";

// POST /api/orders — create a new order
// Used as a server-side fallback; client can also call createOrder() directly
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerId,
      customerPhone,
      serviceType,
      description,
      pickupAddress,
      dropoffAddress,
      pickupCoords,
      dropoffCoords,
      amountKes,
    } = body;

    if (!customerId || !serviceType || !description || !amountKes) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, serviceType, description, amountKes" },
        { status: 400 }
      );
    }

    // Verify the customer exists
    const user = await getUser(customerId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orderId = await createOrder({
      customerId,
      customerPhone: customerPhone || user.phone,
      serviceType,
      description,
      pickupAddress: pickupAddress || "",
      dropoffAddress: dropoffAddress || "",
      pickupCoords: pickupCoords || { lat: -1.2921, lng: 36.8219 },
      dropoffCoords: dropoffCoords || { lat: -1.2921, lng: 36.8219 },
      amountKes: Number(amountKes),
      status: "pending",
      paid: false,
    });

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/orders — not exposed publicly, admin uses Firestore direct
export async function GET() {
  return NextResponse.json({ error: "Use Firestore SDK directly" }, { status: 405 });
}
