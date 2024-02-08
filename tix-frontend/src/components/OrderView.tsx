"use client";

import { Order } from "@/lib/api";
import TicketRecovery from "./TicketRecovery";
import Tickets from "./Tickets";
import { useOrder } from "@/lib/hooks";
import { useEffect, useState } from "react";

export default function OrderView({
  order: initialDetails,
}: {
  order?: Order;
}) {
  const { data: order, isLoading } = useOrder(initialDetails);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!order && !isLoading) {
    return <TicketRecovery />;
  }

  return <Tickets order={order!} />;
}
