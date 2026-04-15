// ── M-Pesa Daraja API helpers ─────────────────────────────
// These run server-side only (in API routes / Cloud Functions)
// Never import this file in client components

export function getDarajaBaseUrl(): string {
  // Toggle between sandbox and production
  const isProd = process.env.NODE_ENV === "production" &&
    process.env.MPESA_ENV === "production";
  return isProd
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getDarajaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set");
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
  const base = getDarajaBaseUrl();

  const res = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja token error: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export function getMpesaTimestamp(): string {
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

export function getMpesaPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export function formatPhoneForMpesa(phone: string): string {
  // Converts any format to 254XXXXXXXXX
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0") && clean.length === 10) return "254" + clean.slice(1);
  if (clean.startsWith("254") && clean.length === 12) return clean;
  if (clean.startsWith("7") && clean.length === 9) return "254" + clean;
  return clean;
}

export interface StkPushParams {
  phone: string;
  amount: number;
  orderId: string;
  description: string;
}

export async function initiateStkPush(params: StkPushParams) {
  const token = await getDarajaToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);
  const phone = formatPhoneForMpesa(params.phone);
  const shortcode = process.env.MPESA_SHORTCODE!;
  const callbackUrl = process.env.MPESA_CALLBACK_URL!;
  const base = getDarajaBaseUrl();

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(params.amount),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: `SasaNow-${params.orderId.slice(0, 8).toUpperCase()}`,
    TransactionDesc: params.description || "Sasa Now delivery",
  };

  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.ResponseCode !== "0") {
    throw new Error(data.ResponseDescription || "STK push failed");
  }

  return {
    checkoutRequestId: data.CheckoutRequestID as string,
    merchantRequestId: data.MerchantRequestID as string,
  };
}
