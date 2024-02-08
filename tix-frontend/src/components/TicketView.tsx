import { Order, Ticket } from "@/lib/api";
import QRCode from "react-qr-code";
import TimeSince from "./TimeSince";

export default function TicketView({
  ticket,
  order,
  index,
  total,
}: {
  ticket: Ticket;
  order: Order;
  index: number;
  total: number;
}) {
  const { id, scanned_at } = ticket;

  return (
    <div className="mx-auto w-screen shrink-0 snap-center p-4 sm:w-80">
      <div className="flex flex-col items-center rounded-xl bg-white p-4 shadow-md">
        <h1 className="text-center text-xl font-medium">{order.name}</h1>
        <p>
          Biljett {index + 1}/{total}
        </p>
        <div className="relative my-4 w-full px-4">
          <QRCode value={id} className="my-4 size-full" />
          <code
            className="absolute -right-4 bottom-0 top-0 flex w-8 items-center justify-center text-nowrap text-center text-xs"
            style={{ writingMode: "vertical-rl" }}
          >
            {id}
          </code>
          <code
            className="absolute -left-4 bottom-0 top-0 flex w-8 items-center justify-center text-center text-xs"
            style={{ writingMode: "vertical-rl" }}
          >
            {order.id}
          </code>
        </div>
        {scanned_at ? (
          <p className="text-sm font-medium text-yellow-500">
            Skannad{" "}
            <time dateTime={scanned_at}>
              {new Date(scanned_at).toLocaleString("sv", {
                hour: "numeric",
                minute: "numeric",
              })}
            </time>{" "}
            (+
            <span className="tabular-nums">
              <TimeSince timestamp={scanned_at} />
            </span>
            )
          </p>
        ) : order.paid_at ? (
          <p className="text-sm">Giltig</p>
        ) : (
          <p className="text-sm font-medium text-red-500">Obetald</p>
        )}
      </div>
    </div>
  );
}
