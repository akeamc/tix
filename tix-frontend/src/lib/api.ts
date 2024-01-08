import { useQuery } from "@tanstack/react-query";
import { useOrderStore } from "./state";

const API_URL = "http://192.168.0.3:8000";

export interface CreateOrder {
  email: string;
  name: string;
  phone: string;
  count: number;
}

export interface Order {
  id: string;
  email: string;
  name: string;
  phone: string;
  amount: number;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

export async function createOrder(req: CreateOrder): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error(
      "Ett fel uppstod när ordern skulle skapas: " + (await res.text()),
    );
  }

  return res.json();
}

export async function cancelOrder(id: string, email: string): Promise<Order> {
  const res = await fetch(
    `${API_URL}/orders/${id}?email=${encodeURIComponent(email)}`,
    {
      method: "DELETE",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to cancel order");
  }

  return res.json();
}

export async function completeOrder(id: string, email: string): Promise<Order> {
  const res = await fetch(
    `${API_URL}/orders/${id}/complete?email=${encodeURIComponent(email)}`,
    {
      method: "POST",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to complete order");
  }

  return res.json();
}

interface Ticket {
  id: string;
  order_id: string;
}

export async function getTickets(
  orderId: string,
  email: string,
): Promise<Ticket[]> {
  const res = await fetch(
    `${API_URL}/orders/${orderId}/tickets?email=${encodeURIComponent(email)}`,
  );

  if (!res.ok) {
    throw new Error("Failed to get tickets");
  }

  return res.json();
}

export async function getOrder(id: string, email: string): Promise<Order> {
  const res = await fetch(
    `${API_URL}/orders/${id}?email=${encodeURIComponent(email)}`,
  );

  if (!res.ok) {
    throw new Error("Failed to get order");
  }

  return res.json();
}

export function useTickets(order?: Order | null) {
  return useQuery({
    queryKey: ["tickets", order?.id, order?.email],
    enabled: !!order,
    queryFn: () => getTickets(order!.id, order!.email),
  });
}

export async function getTicketsRemaining(): Promise<number> {
  const res = await fetch(`${API_URL}/tickets/remaining`);

  if (!res.ok) {
    throw new Error("Failed to get tickets remaining");
  }

  return res.json();
}

export function useOrder() {
  const { details } = useOrderStore();

  return useQuery({
    queryKey: ["orders", details?.id],
    enabled: !!details,
    queryFn: () => getOrder(details!.id, details!.email),
  });
}
