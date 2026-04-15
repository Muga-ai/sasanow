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
  name: string;
  role: UserRole;
  location?: { lat: number; lng: number };
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
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
  estimatedMinutes?: number;
}

export interface Rider {
  uid: string;
  name: string;
  phone: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  totalDeliveries: number;
  rating: number;
}