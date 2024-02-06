import { Order } from "@/lib/api";
import QRCode from "react-qr-code";

export default function Ticket({
  id,
  order,
  index,
  total,
}: {
  id: string;
  order: Order;
  index: number;
  total: number;
}) {
  return (
    <div className="mx-auto w-screen shrink-0 snap-center p-4 sm:w-80">
      <div className="flex flex-col items-center rounded-xl bg-white p-4 shadow-md">
        <h1 className="text-center text-xl font-medium">{order.name}</h1>
        <p>
          Biljett {index + 1}/{total}
        </p>
        <div className="w-full px-4">
          <QRCode value={id} className="my-4 size-full" />
        </div>
        <code className="block text-center text-xs font-medium">{id}</code>
      </div>
    </div>
  );
}
