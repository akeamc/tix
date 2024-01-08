"use client";

import OrderForm from "./OrderForm";
import PaymentRequest from "./PaymentRequest";
import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/state";
import { useOrder } from "@/lib/api";
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
        <CheckCircle className="mx-auto size-20 text-green-500 bg-green-100 p-4 rounded-xl mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">
          Tack för ditt köp!
        </h1>
        <p className="text-gray-700 mt-2 max-w-sm mx-auto">
          Biljetterna skickas till {order.email} när evenemanget närmar sig.
          Kontakta{" "}
          <a href="https://instagram.com/elevkaren" className="underline">
            @elevkaren
          </a>{" "}
          vid frågor.
        </p>
        <p className="text-gray-700 text-xs mt-2">
          Ordernummer:{" "}
          <code className="px-[0.2em] py-[0.1em] bg-gray-200 rounded-sm text-black">
            {order.id}
          </code>
        </p>
        <button
          onClick={() => setDetails(null)}
          className="mt-4 underline text-gray-700 text-sm"
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
        <p className="text-gray-700 mt-2">Din beställning har avbrutits.</p>
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
