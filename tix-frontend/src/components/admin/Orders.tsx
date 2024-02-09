"use client";

import { Order, Ticket, sendEmail } from "@/lib/api";
import { useOrders, useTicketStats } from "@/lib/hooks";
import classNames from "classnames";
import { parsePhoneNumber } from "libphonenumber-js";
import { useState } from "react";
import { RefreshCw } from "react-feather";
import SwishImport from "./SwishImport";
import Button from "../Button";
import { useMutation } from "@tanstack/react-query";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("sv", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  });
}

function Row({
  order,
  ticket,
  selected,
  onSelectedChange,
}: {
  order: Order;
  ticket: Ticket;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const phone = parsePhoneNumber(order.phone, "SE");
  const used = !!ticket.scanned_at;
  const [expanded, setExpanded] = useState(false);

  return (
    <tr
      className={classNames({
        "bg-green-50 text-green-500": used,
        "bg-yellow-50 text-yellow-500":
          !used && !order.paid_at && !order.canceled_at,
        "text-gray-400": !used && order.canceled_at,
      })}
    >
      {/* <td className="border p-1">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              onSelectedChange(e.target.checked);
            }}
          />
        </div>
      </td> */}
      <td className="border px-1 py-1.5 font-mono print:py-0.5">{order.id}</td>
      <td className="border px-1 py-1.5 print:py-0.5">{order.name}</td>
      <td className="border px-1 py-1.5 print:py-0.5">{order.email}</td>
      <td className="border px-1 py-1.5 print:py-0.5">
        <a className="hover:underline" href={phone.getURI()}>
          {phone.formatNational()}
        </a>
      </td>
      <td className="border px-1 py-1.5 print:py-0.5">
        {formatDateTime(order.created_at)}
      </td>
      <td className="border px-1 py-1.5 print:py-0.5">
        {order.paid_at ? formatDateTime(order.paid_at) : "-"}
      </td>
      <td className="border px-1 py-1.5 print:py-0.5">
        {order.canceled_at ? formatDateTime(order.canceled_at) : "-"}
      </td>
      <td
        className="border px-1 py-1.5 text-right font-mono print:py-0.5"
        title={ticket.id}
        onClick={() => setExpanded((v) => !v)}
      >
        {ticket.id.substring(0, expanded ? undefined : 8)}
        {expanded ? undefined : "..."}
      </td>
      <td className="border px-1 py-1.5 text-right print:py-0.5">
        {ticket.scanned_at
          ? new Date(ticket.scanned_at).toLocaleString("sv", {
              hour: "numeric",
              minute: "numeric",
            })
          : "-"}
      </td>
      <td className="border px-1 py-1.5 print:py-0.5">
        {order.emailed_at ? formatDateTime(order.emailed_at) : "-"}
      </td>
      {/* <td className="border px-1 py-1.5 text-right">
        {order.amount.toLocaleString("sv", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
      </td> */}
    </tr>
  );
}

function Toolbar() {
  const { isFetching, refetch, error, data } = useOrders();
  const { data: ticketStats } = useTicketStats();
  const {mutate: runSendEmail, data: emailsSent} = useMutation({
    mutationKey: ["sendEmail"],
    mutationFn: sendEmail,
    onSuccess: () => refetch(),
  });
  const scannedTickets = data?.flatMap((order) =>
    order.tickets.filter((ticket) => ticket.scanned_at),
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2">
      <Button disabled={isFetching} onClick={() => refetch()}>
        <RefreshCw className={isFetching ? "animate-spin" : undefined} />
        Uppdatera
      </Button>
      {error && (
        <div className="rounded bg-red-50 px-2 py-1 text-xs text-red-500">
          {error.message}
        </div>
      )}
      <SwishImport />
      <Button onClick={() => runSendEmail()}>
        Skicka mejl
        {typeof emailsSent === "number" ? ` (${emailsSent})` : ""}
      </Button>
      {data && (
        <div className="text-xs text-gray-700">
          {scannedTickets?.length} skannade av {ticketStats?.paid} sålda
          biljetter
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [selected, setSelected] = useState<string[]>([]);
  const { data: orders } = useOrders();

  return (
    <div>
      <Toolbar />
      <div className="overflow-x-auto">
        <table className="w-full text-sm print:text-xs">
          <thead className="bg-gray-100 text-xs">
            <tr>
              {/* <th /> */}
              <th className="p-1 py-2 text-left font-semibold">Ordernummer</th>
              <th className="p-1 py-2 text-left font-semibold">Namn</th>
              <th className="p-1 py-2 text-left font-semibold">E-postadress</th>
              <th className="p-1 py-2 text-left font-semibold">
                Telefonnummer
              </th>
              <th className="p-1 py-2 text-left font-semibold">Skapad</th>
              <th className="p-1 py-2 text-left font-semibold">Betald</th>
              <th className="p-1 py-2 text-left font-semibold">Avbruten</th>
              <th className="p-1 py-2 text-left font-semibold">
                Biljettnummer
              </th>
              <th className="p-1 py-2 text-left font-semibold">Skannad</th>
              <th className="p-1 py-2 text-left font-semibold">Biljetter mejlade</th>
              {/* <th className="p-1 py-2 text-left font-semibold">Pris</th> */}
            </tr>
          </thead>
          <tbody>
            {orders?.flatMap((order) =>
              order.tickets.map((ticket) => (
                <Row
                  key={order.id}
                  order={order}
                  ticket={ticket}
                  selected={selected.includes(order.id)}
                  onSelectedChange={(v) => {
                    if (v) {
                      setSelected([...selected, order.id]);
                    } else {
                      setSelected(selected.filter((id) => id !== order.id));
                    }
                  }}
                />
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
