"use client";

import OrderForm from "./OrderForm";
import PaymentRequest from "./PaymentRequest";
import { useEffect, useState } from "react";
import { useOrderStore } from "@/lib/state";
import { useOrder } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "react-feather";

export default function Checkout() {
  const queryClient = useQueryClient();
  const { data: order } = useOrder();
  const { setDetails } = useOrderStore();
  const [cancelled, setCancelled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // const router = useRouter();
  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // if (order?.paid_at) {
  //   router.push("/tickets");
  //   return null;
  // }

  if (order?.completed_at) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 size-20 rounded-xl bg-green-100 p-4 text-green-500" />
        <h1 className="text-4xl font-bold tracking-tight">
          Tack för ditt köp!
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-gray-700">
          Biljetterna skickas till {order.email} när evenemanget närmar sig.
          Kontakta{" "}
          <a href="https://instagram.com/elevkaren" className="underline">
            @elevkaren
          </a>{" "}
          vid frågor.
        </p>
        <p className="mt-2 text-xs text-gray-700">
          Ordernummer:{" "}
          <code className="rounded-sm bg-gray-200 px-[0.2em] py-[0.1em] text-black">
            {order.id}
          </code>
        </p>
        <button
          onClick={() => setDetails(null)}
          className="mt-4 text-sm text-gray-700 underline"
        >
          Köp fler biljetter
        </button>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Betalning avbruten
        </h1>
        <p className="mt-2 text-gray-700">Din beställning har avbrutits.</p>
      </div>
    );
  }

  if (order) {
    return (
      <PaymentRequest
        order={order}
        onComplete={(order) => {
          queryClient.setQueryData(["orders", order.id], order);
        }}
        onCancel={() => {
          setDetails(null);
          setCancelled(true);
        }}
      />
    );
  }

  return (
    <OrderForm
      onCreate={(order) => {
        setDetails({ id: order.id, email: order.email });
      }}
    />
  );
}
