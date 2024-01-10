"use client";

import { Order, getOrders, uploadSwishReport } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { ButtonHTMLAttributes, DetailedHTMLProps, PropsWithChildren, useRef, useState } from "react";
import { RefreshCw, Upload } from "react-feather";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("sv", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  });
}

function Row({ order, selected, onSelectedChange }: { order: Order, selected: boolean, onSelectedChange: (selected: boolean) => void; }) {
  return (
    <tr className={classNames({ "text-gray-500": order.canceled_at })}>
      <td className="border p-1">
        <div className="flex items-center justify-center">
          <input type="checkbox" checked={selected} onChange={(e) => {
            onSelectedChange(e.target.checked);
          }} />
        </div>
      </td>
      <td className="border p-1 font-mono">{order.id}</td>
      <td className="border p-1">{order.name}</td>
      <td className="border p-1">{order.email}</td>
      <td className="border p-1">{order.phone}</td>
      <td className="border p-1">{formatDateTime(order.created_at)}</td>
      <td className="border p-1">{order.paid_at ? formatDateTime(order.paid_at) : "-"}</td>
      <td className="border p-1">{order.canceled_at ? formatDateTime(order.canceled_at) : "-"}</td>
      <td className="border p-1">{order.amount.toLocaleString("sv", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
    </tr>
  )
}

const useOrders = () => useQuery({
  queryKey: ["orders"],
  queryFn: getOrders,
  refetchInterval: 10000,
});

function Button({ children, className, disabled, ...props }: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return (
    <button disabled={disabled} className={classNames("px-2 py-1 border font-medium rounded text-xs flex gap-2 items-center shadow-sm hover:bg-gray-100 active:shadow-none active:bg-gray-200 [&>svg]:size-4", { "text-gray-500": disabled }, className)} {...props}>
      {children}
    </button>
  )
}

function SwishImport() {
  const [file, setFile] = useState<File | null>(null);
  const { data, mutate } = useMutation({
    mutationKey: ["swishImport"],
    mutationFn: async () => {
      if (!file) {
        return;
      }

      return uploadSwishReport(file);
    }
  });

  return (
    <>
      <input type="file" onChange={(e) => { if (e.target.files) { setFile(e.target.files[0]) } }} />
      <Button onClick={() => mutate()}>
        <Upload />
        Importera Swishrapport
      </Button>
    </>
  );
}

function Toolbar() {
  const { isFetching, refetch, error } = useOrders();

  return (
    <div className="py-2 flex gap-4 items-center">
      <Button disabled={isFetching} onClick={() => refetch()}>
        <RefreshCw className={isFetching ? "animate-spin" : undefined} />
        Uppdatera
      </Button>
      {error && <div className="text-red-500 text-xs bg-red-50 rounded px-2 py-1">{error.message}</div>}
      <SwishImport />
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
        <table className="text-sm w-full">
          <thead className="bg-gray-100 text-xs">
            <tr>
              <th />
              <th className="text-left p-1 py-2 font-semibold">Ordernummer</th>
              <th className="text-left p-1 py-2 font-semibold">Namn</th>
              <th className="text-left p-1 py-2 font-semibold">E-postadress</th>
              <th className="text-left p-1 py-2 font-semibold">Telefonnummer</th>
              <th className="text-left p-1 py-2 font-semibold">Skapad</th>
              <th className="text-left p-1 py-2 font-semibold">Betald</th>
              <th className="text-left p-1 py-2 font-semibold">Avbruten</th>
              <th className="text-left p-1 py-2 font-semibold">Pris</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => <Row key={order.id} order={order} selected={selected.includes(order.id)} onSelectedChange={(v) => {
              if (v) {
                setSelected([...selected, order.id]);
              } else {
                setSelected(selected.filter((id) => id !== order.id));
              }
            }} />)}
          </tbody>
        </table>
        {orders !== undefined && <div className="text-sm text-gray-700 mt-2">
          {orders?.length} ordrar
        </div>}
      </div>
    </div>

  )
}