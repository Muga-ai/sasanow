import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/firestore";

// ── Daraja helpers ──────────────────────────────────────────

async function getDarajaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error("Failed to get Daraja token");
  const data = await res.json();
  return data.access_token;
}

function getTimestamp(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
}

function getPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

function formatPhone(phone: string): string {
  // Normalize to 254XXXXXXXXX format
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) return "254" + clean.slice(1);
  if (clean.startsWith("+")) return clean.slice(1);
  return clean;
}

// ── Route handler ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId, description } = await req.json();

    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { error: "phone, amount and orderId are required" },
        { status: 400 }
      );
    }

    const token = await getDarajaToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);
    const formattedPhone = formatPhone(phone);
    const shortcode = process.env.MPESA_SHORTCODE!;
    const callbackUrl = process.env.MPESA_CALLBACK_URL!;

    const stkBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount), // M-Pesa requires integer
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `SasaNow-${orderId.slice(0, 8).toUpperCase()}`,
      TransactionDesc: description || "Sasa Now delivery payment",
    };

    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkBody),
      }
    );

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkData.ResponseDescription || "STK push failed" },
        { status: 400 }
      );
    }

    // Store the CheckoutRequestID on the order so we can match the callback
    await updateOrderStatus(orderId, "pending", {
      mpesaRef: stkData.CheckoutRequestID,
    } as any);

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
    });
  } catch (err: any) {
    console.error("STK push error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
