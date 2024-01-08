import { Order, useTickets } from "@/lib/api";
import { useEffect, useState } from "react";
import Ticket from "./Ticket";

export default function Tickets({ order }: { order: Order | null }) {
  const [loaded, setLoaded] = useState(false);
  const { data } = useTickets(order);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div>
      {data?.map(({ id }) => <Ticket key={id} id={id} order={order!} />)}
    </div>
  );
}
