export type UserRole = "customer" | "rider" | "admin";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export interface SasaUser {
  uid: string;
  phone: string;
  email?: string;           // added for email-signup users
  name: string;
  role: UserRole;
  location?: {
    lat?: number;
    lng?: number;
    area?: string;          // Nairobi area e.g. "Westlands"
  };
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  customerPhone: string;
  serviceType: string;
  description: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
  status: OrderStatus;
  riderId?: string;
  riderName?: string;
  amountKes: number;
  mpesaRef?: string;
  mpesaTransactionId?: string;
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
  estimatedMinutes?: number;
}

export interface Rider {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  area?: string;
  vehicleType?: "bicycle" | "motorbike" | "car";
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  currentOrderId?: string | null;
  totalDeliveries: number;
  rating: number;
}
