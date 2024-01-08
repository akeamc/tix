import { Order } from "@/lib/api";
import QRCode from "react-qr-code";

export default function Ticket({ id, order }: { id: string; order: Order }) {
  return (
    <div className="flex-col max-w-80 bg-white p-4 rounded-xl shadow-md">
      <h1 className="text-xl font-medium text-center">{order.name}</h1>
      <QRCode value={id} className="size-full my-4" />
      <code className="text-xs text-center block font-medium">{id}</code>
    </div>
  );
}
