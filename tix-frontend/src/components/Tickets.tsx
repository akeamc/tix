import { Order } from "@/lib/api";
import TicketView from "./TicketView";
import { AlertCircle } from "react-feather";
import dynamic from "next/dynamic";
import { useTickets } from "@/lib/hooks";

const MeshGradientRenderer = dynamic(
  () =>
    import("@johnn-e/react-mesh-gradient").then(
      (mod) => mod.MeshGradientRenderer,
    ),
  { ssr: false },
);

export default function Tickets({ order }: { order: Order | null }) {
  const { data } = useTickets(order?.id, order?.email);

  return (
    <div className="relative flex min-h-screen flex-col">
      <MeshGradientRenderer
        className="inset-0"
        colors={["#31029c", "#c90099", "#bffffd", "#22016d", "#d3c0ff"]}
        speed={0.01}
      />
      <svg>
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"
              result="goo"
            />
            <feBlend in2="goo" in="SourceGraphic" result="mix" />
          </filter>
        </defs>
      </svg>
      <div className="z-20 flex grow snap-x snap-mandatory flex-nowrap items-center overflow-x-auto">
        {data?.map((ticket, i) => (
          <TicketView
            key={ticket.id}
            ticket={ticket}
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
