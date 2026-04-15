import { NextRequest, NextResponse } from "next/server";
import { getDocs, query, collection, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ message: "Invalid callback" }, { status: 400 });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callback;

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("mpesaRef", "==", CheckoutRequestID));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("No order found for CheckoutRequestID:", CheckoutRequestID);
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const orderDoc = snap.docs[0];
    const orderId = orderDoc.id;

    if (ResultCode === 0) {
      const items: any[] = CallbackMetadata?.Item || [];
      const getMeta = (name: string) =>
        items.find((i: any) => i.Name === name)?.Value || "";

      const mpesaTransactionId = getMeta("MpesaReceiptNumber");
      const amountPaid = getMeta("Amount");
      const phonePaid = getMeta("PhoneNumber");

      await updateDoc(doc(db, "orders", orderId), {
        paid: true,
        status: "accepted",
        mpesaTransactionId,
        amountPaid,
        phonePaid: String(phonePaid),
        paidAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(doc(db, "orders", orderId), {
        paid: false,
        status: "cancelled",
        cancelReason: ResultDesc || "Payment failed or cancelled",
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err: any) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

