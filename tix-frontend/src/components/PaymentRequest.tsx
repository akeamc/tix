import { Order, cancelOrder, completeOrder } from "@/lib/api";
import SwishQr, { SwishQrProps } from "./SwishQr";

export interface PaymentRequestProps {
  order: Order;
  onComplete: (order: Order) => void;
  onCancel: (order: Order) => void;
}

export default function PaymentRequest({
  order,
  ...props
}: PaymentRequestProps) {
  function onComplete() {
    if (confirm("Är du säker på att du har betalat?")) {
      completeOrder(order.id, order.email)
        .then(props.onComplete)
        .catch(() => {
          alert("Något gick fel. Försök igen.");
        });
    }
  }

  function onCancel() {
    if (
      prompt(`Skriv "${order.id}" för att avbryta köpet.`)?.toUpperCase() ===
      order.id
    ) {
      cancelOrder(order.id, order.email)
        .then(props.onCancel)
        .catch(() => alert("Något gick fel. Försök igen."));
    }
  }

  return (
    <div>
      <h1 className="mb-4">
        <span className="font-medium text-gray-700">Att betala</span>
        <br />
        <span className="text-4xl font-bold tracking-tight">
          {order.amount.toLocaleString("sv", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          &nbsp;kr
        </span>
      </h1>
      <p className="mb-2 text-gray-700">
        Använd Swish för att slutföra köpet och tryck på &quot;Klar&quot; när du
        har betalat.
      </p>
      <SwishQr payee="123-345 69 51" amount={order.amount} message={order.id} />
      <button
        className="mt-4 w-full rounded-lg bg-green-500 py-4 text-lg font-medium text-white shadow hover:bg-green-600 active:bg-green-700"
        onClick={onComplete}
      >
        Klar
      </button>
      <button
        className="mx-auto mt-2 block rounded px-1 text-sm underline transition-colors hover:bg-gray-200"
        onClick={onCancel}
      >
        Avbryt köp
      </button>
    </div>
  );
}
