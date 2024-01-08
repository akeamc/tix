"use client";

import TicketRecovery from "@/components/TicketRecovery";
import Tickets from "@/components/Tickets";
import { useOrder } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: order } = useOrder();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (order && !order.paid_at) {
    router.push("/checkout");
    return null;
  }

  if (!order) {
    return <TicketRecovery />;
  }

  return (
    <main>
      <h1>Tickets</h1>
      <Tickets order={order} />
    </main>
  );
}
