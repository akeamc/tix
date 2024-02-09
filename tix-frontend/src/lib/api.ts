const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  canceled_at: string | null;
  emailed_at: string | null;
}

export async function createOrder(req: CreateOrder): Promise<Order> {
  const res = await request(`/orders`, {
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
  const res = await request(
    `/orders/${id}?email=${encodeURIComponent(email)}`,
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
  const res = await request(
    `/orders/${id}/complete?email=${encodeURIComponent(email)}`,
    {
      method: "POST",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to complete order");
  }

  return res.json();
}

export interface Ticket {
  id: string;
  order_id: string;
  scanned_at?: string;
}

export async function getTickets(
  orderId: string,
  email?: string,
): Promise<Ticket[]> {
  let path = `/orders/${orderId}/tickets`;
  if (email) {
    path += "?email=" + encodeURIComponent(email);
  }
  const res = await request(path);

  if (!res.ok) {
    throw new Error("Failed to get tickets");
  }

  return res.json();
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const res = await request(`/tickets/${encodeURIComponent(id)}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to get ticket");
  }

  return res.json();
}

interface Scan {
  ticket: Ticket;
  order: Order;
  already_scanned: boolean;
  remaining_unscanned: number;
}

export async function scanTicket(id: string): Promise<Scan | null> {
  const res = await request(`/tickets/${encodeURIComponent(id)}/scan`, {
    method: "POST",
  });

  if (res.status === 404 || res.status === 400) {
    // Ticket not found
    return null;
  } else if (!res.ok) {
    throw new Error("Failed to scan ticket");
  }

  return res.json();
}

export async function getOrder(
  id: string,
  email: string,
): Promise<Order | null> {
  const res = await request(`/orders/${id}?email=${encodeURIComponent(email)}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to get order");
  }

  return res.json();
}

export async function getTicketsRemaining(): Promise<number> {
  const res = await request("/tickets/remaining");

  if (!res.ok) {
    throw new Error("Failed to get tickets remaining");
  }

  return res.json();
}

export interface LoginRequest {
  id_token: string;
  nonce: string;
}

export interface Identity {
  email: string;
}

export async function login(req: LoginRequest): Promise<Identity> {
  const res = await request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error("Failed to login");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  const res = await request("/auth/logout", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to logout");
  }
}

export async function getIdentity(): Promise<Identity | null> {
  const res = await request("/auth");

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function request(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
  });
}

interface DetailedOrder extends Order {
  tickets: Ticket[];
}

export async function getOrders(): Promise<DetailedOrder[]> {
  const res = await request("/orders");

  if (!res.ok) {
    throw new Error("Failed to get orders");
  }

  return res.json();
}

export interface TicketStats {
  paid: number;
}

export async function getTicketStats(): Promise<TicketStats> {
  const res = await request("/tickets/stats");

  if (!res.ok) {
    throw new Error("Failed to get ticket stats");
  }

  return res.json();
}

export async function uploadSwishReport(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await request("/orders/swish", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload swish report");
  }
}

export async function sendEmail(): Promise<number> {
  const res = await request("/orders/email", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to send emails");
  }

  return res.json();
}
