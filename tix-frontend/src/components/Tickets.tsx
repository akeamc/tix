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
  { ssr: false, },
);

export default function Tickets({ order }: { order: Order | null }) {
  const [loaded, setLoaded] = useState(false);
  const { data } = useTickets(order?.id, order?.email);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="relative min-h-screen flex-col flex">
      <MeshGradientRenderer
        className="inset-0"
        colors={["#C41E3D", "#7D1128", "#FF2C55", "#3C0919", "#E2294F"]}
      />
      <div className="z-20 grow snap-x snap-mandatory overflow-x-auto flex flex-nowrap items-center">
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
      <div className="text-white p-2 flex gap-2 items-center">
        <AlertCircle className="size-6 shrink-0" />{" "}
        <p>Öka skärmljusstyrkan så att biljetten kan skannas.</p>
      </div>
    </div>
  );
}
