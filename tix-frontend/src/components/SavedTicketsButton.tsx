"use client";

import { useOrder, useTickets } from "@/lib/hooks";
import Link from "next/link";

export default function SavedTicketsButton() {
  const { data: order } = useOrder();
  const { data: tickets } = useTickets(order?.id, order?.email);

  if (!tickets) return null; // TODO

  return (
    <Link
      href="/tickets"
      className="relative inline-block rounded-lg border-2 border-white px-6 py-3 text-center font-medium hover:bg-white hover:text-black hover:outline hover:outline-offset-2 md:px-8 md:py-4 md:text-xl"
    >
      Visa biljetter
      {tickets && (
        <span className="absolute right-0 top-0 -mr-3 -mt-3 flex size-6 items-center justify-center rounded-full bg-white text-xs text-black">
          {tickets.length}
        </span>
      )}
    </Link>
  );
}
