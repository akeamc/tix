import { Order, useTickets } from "@/lib/api";
import { useEffect, useState } from "react";
import Ticket from "./Ticket";
import { AlertCircle } from "react-feather";
import dynamic from "next/dynamic";

const MeshGradientRenderer = dynamic(
  () =>
    import("@johnn-e/react-mesh-gradient").then(
      (mod) => mod.MeshGradientRenderer,
    ),
  { ssr: false },
);

export default function Tickets({ order }: { order: Order | null }) {
  const [loaded, setLoaded] = useState(false);
  const { data } = useTickets(order?.id, order?.email);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <MeshGradientRenderer
        className="inset-0"
        colors={["#C41E3D", "#7D1128", "#FF2C55", "#3C0919", "#E2294F"]}
      />
      <div className="z-20 flex grow snap-x snap-mandatory flex-nowrap items-center overflow-x-auto">
        {data?.map(({ id }, i) => (
          <Ticket
            key={id}
            id={id}
            order={order!}
            index={i}
            total={data.length}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 p-2 text-white">
        <AlertCircle className="size-6 shrink-0" />{" "}
        <p>Öka skärmljusstyrkan så att biljetten kan skannas.</p>
      </div>
    </div>
  );
}
