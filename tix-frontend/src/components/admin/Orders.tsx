"use client";

import {
  Order,
  getOrders,
  getTicketStats,
  uploadSwishReport,
  useOrders,
  useTicketStats,
  useTickets,
} from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { parsePhoneNumber } from "libphonenumber-js";
import { ButtonHTMLAttributes, DetailedHTMLProps, useState } from "react";
import { RefreshCw, Upload } from "react-feather";
import SwishImport from "./SwishImport";
import Button from "../Button";

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
  selected,
  onSelectedChange,
}: {
  order: Order;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const { data: tickets } = useTickets(order.id);
  const phone = parsePhoneNumber(order.phone, "SE");

  return (
    <tr
      className={classNames({
        "bg-yellow-50 text-yellow-500": !order.paid_at && !order.canceled_at,
        "text-gray-400": order.canceled_at,
      })}
    >
      <td className="border p-1">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              onSelectedChange(e.target.checked);
            }}
          />
        </div>
      </td>
      <td className="border px-1 py-1.5 font-mono">{order.id}</td>
      <td className="border px-1 py-1.5">{order.name}</td>
      <td className="border px-1 py-1.5">{order.email}</td>
      <td className="border px-1 py-1.5">
        <a className="hover:underline" href={phone.getURI()}>
          {phone.formatNational()}
        </a>
      </td>
      <td className="border px-1 py-1.5">{formatDateTime(order.created_at)}</td>
      <td className="border px-1 py-1.5">
        {order.paid_at ? formatDateTime(order.paid_at) : "-"}
      </td>
      <td className="border px-1 py-1.5">
        {order.canceled_at ? formatDateTime(order.canceled_at) : "-"}
      </td>
      <td className="border px-1 py-1.5 text-right">{tickets?.length}</td>
      <td className="border px-1 py-1.5 text-right">
        {order.amount.toLocaleString("sv", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
      </td>
    </tr>
  );
}

function Toolbar() {
  const { isFetching, refetch, error } = useOrders();

  return (
    <div className="flex items-center gap-4 py-2">
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
    </div>
  );
}

export default function Orders() {
  const [selected, setSelected] = useState<string[]>([]);
  const { data: orders } = useOrders();
  const { data: ticketStats } = useTicketStats();

  return (
    <div>
      <Toolbar />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs">
            <tr>
              <th />
              <th className="p-1 py-2 text-left font-semibold">Ordernummer</th>
              <th className="p-1 py-2 text-left font-semibold">Namn</th>
              <th className="p-1 py-2 text-left font-semibold">E-postadress</th>
              <th className="p-1 py-2 text-left font-semibold">
                Telefonnummer
              </th>
              <th className="p-1 py-2 text-left font-semibold">Skapad</th>
              <th className="p-1 py-2 text-left font-semibold">Betald</th>
              <th className="p-1 py-2 text-left font-semibold">Avbruten</th>
              <th className="p-1 py-2 text-left font-semibold">Biljetter</th>
              <th className="p-1 py-2 text-left font-semibold">Pris</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <Row
                key={order.id}
                order={order}
                selected={selected.includes(order.id)}
                onSelectedChange={(v) => {
                  if (v) {
                    setSelected([...selected, order.id]);
                  } else {
                    setSelected(selected.filter((id) => id !== order.id));
                  }
                }}
              />
            ))}
          </tbody>
        </table>
        {orders !== undefined && (
          <div className="mt-2 text-sm text-gray-700">
            {orders?.length} ordrar, {ticketStats?.paid} sålda biljetter
          </div>
        )}
      </div>
    </div>
  );
}
