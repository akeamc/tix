"use client";

import TicketRecovery from "@/components/TicketRecovery";
import Tickets from "@/components/Tickets";
import { useOrder } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const { data: order, isLoading } = useOrder();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // if (order && !order.paid_at) {
  //   router.push("/checkout");
  //   return null;
  // }

  if (!order && !isLoading) {
    return <TicketRecovery />;
  }

  return (
    <main>
      <Tickets order={order!} />
    </main>
  );
};

export default Page;
