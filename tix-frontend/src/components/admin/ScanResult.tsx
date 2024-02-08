import { scanTicket } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "react-feather";
import TimeSince from "../TimeSince";

function Icon({
  invalid,
  alreadyScanned,
}: {
  invalid: boolean;
  alreadyScanned: boolean;
}) {
  let IconComponent = X;
  let text = "Ogiltig";
  let color = "text-red-500";
  let background = "bg-red-50";

  if (!invalid) {
    IconComponent = Check;
    text = "Giltig";
    color = "text-green-500";
    background = "bg-green-50";
  }

  if (alreadyScanned) {
    IconComponent = AlertTriangle;
    text = "Redan skannad";
    color = "text-yellow-500";
    background = "bg-yellow-50";
  }

  return (
    <div className={`${color} text-center`}>
      <div className={`${background} size-40 rounded-full p-8`}>
        <IconComponent className="size-full" />
      </div>
      <p className="my-4 text-lg font-medium">{text}</p>
    </div>
  );
}

function ScannedAt(props: { timestamp: string }) {
  const timestamp = new Date(props.timestamp);

  return (
    <div className="flex flex-col">
      {timestamp.toLocaleString("sv", {
        hour: "numeric",
        minute: "numeric",
      })}
      <span className="text-xs font-medium tabular-nums text-gray-500">
        <TimeSince timestamp={props.timestamp} /> sedan
      </span>
    </div>
  );
}

export default function ScanResult({
  id,
  dismiss,
}: {
  id?: string;
  dismiss: () => void;
}) {
  const { data, mutate, isSuccess, isError } = useMutation({
    mutationKey: ["tickets", id, "scan"],
    mutationFn: () => scanTicket(id!),
    retry: 1, // retry once
  });

  useEffect(() => {
    if (id) {
      mutate();
    }
  }, [id, mutate]);

  const invalid = data === null;

  if (!id || !isSuccess) {
    // show spinner
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-sm text-gray-500">
        {isError ? (
          <p className="my-auto max-w-80 text-center text-lg text-red-500">
            Ett fel uppstod. Prova att skanna igen eller kontakta support (Åke).
          </p>
        ) : (
          <svg
            className="my-auto size-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        <code>{id}</code>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="my-auto">
        <Icon
          invalid={invalid}
          alreadyScanned={data?.already_scanned ?? false}
        />
        {data && (
          <table className="w-full">
            <tr className="border-b">
              <td className="py-2 text-sm text-gray-500">Skannad</td>
              <td className="w-full py-2 text-right font-medium">
                <ScannedAt timestamp={data.ticket.scanned_at!} />
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm text-gray-500">Namn</td>
              <td className="py-2 text-right font-medium">{data.order.name}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm text-gray-500">Ordernummer</td>
              <td className="py-2 text-right font-medium">{data.order.id}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm text-gray-500">
                Återstående biljetter
              </td>
              <td className="py-2 text-right font-medium">
                {data.remaining_unscanned}
              </td>
            </tr>
          </table>
        )}
      </div>
      <code className="text-sm text-gray-500">{id}</code>
    </div>
  );
}
