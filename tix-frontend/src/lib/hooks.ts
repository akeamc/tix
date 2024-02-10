import { useQuery } from "@tanstack/react-query";
import { OrderDetails, useOrderStore } from "./state";
import { useEffect } from "react";
import { getOrder, getOrders, getTicketStats, getTickets } from "./api";

export function useTickets(id?: string, email?: string) {
  return useQuery({
    queryKey: ["orders", id, "tickets"],
    enabled: !!id,
    queryFn: () => getTickets(id!, email!),
    refetchInterval: 2000,
  });
}

export function useOrder(initialDetails?: OrderDetails) {
  const { details: fallbackDetails, setDetails } = useOrderStore();
  const details = initialDetails || fallbackDetails;

  const q = useQuery({
    queryKey: ["orders", details?.id],
    enabled: !!details,
    queryFn: () => getOrder(details!.id, details!.email),
  });

  useEffect(() => {
    // order was deleted
    if (q.data === null) {
      setDetails(null);
    }
  }, [q.data, setDetails]);

  return q;
}

export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    refetchInterval: 10000,
  });

export const useTicketStats = () =>
  useQuery({
    queryKey: ["ticketStats"],
    queryFn: getTicketStats,
    refetchInterval: 10000,
  });
