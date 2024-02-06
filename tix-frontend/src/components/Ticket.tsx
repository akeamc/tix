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
    <div className="snap-center shrink-0 w-screen sm:w-80 p-4 mx-auto">
      <div className="flex flex-col bg-white p-4 rounded-xl shadow-md items-center">
        <h1 className="text-xl font-medium text-center">{order.name}</h1>
        <p>
          Biljett {index + 1}/{total}
        </p>
        <div className="w-full px-4">
          <QRCode value={id} className="size-full my-4" />
        </div>
        <code className="text-xs text-center block font-medium">{id}</code>
      </div>
    </div>
  );
}
