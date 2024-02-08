import { scanTicket } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "react-feather";

function Icon({
  invalid,
  alreadyScanned,
}: {
  invalid: boolean;
  alreadyScanned: boolean;
}) {
  let IconComponent = X;
  let text = "Ogiltig biljett";
  let color = "red";

  if (!invalid) {
    IconComponent = Check;
    text = "Giltig biljett";
    color = "green";
  }

  if (alreadyScanned) {
    IconComponent = AlertTriangle;
    text = "Redan skannad";
    color = "yellow";
  }

  return (
    <div className={`text-${color}-500 text-center`}>
      <div className={`bg-${color}-50 size-40 rounded-full p-8`}>
        <IconComponent className="size-full" />
      </div>
      <p className="my-4 text-lg font-medium">{text}</p>
    </div>
  );
}

function ScannedAt(props: { timestamp: string }) {
  const timestamp = new Date(props.timestamp);
  const [now, setNow] = useState<Date | undefined>();

  useEffect(() => {
    setNow(new Date());

    const i = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(i);
  }, []);

  if (!now) return null;

  const delta = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  const second = (delta % 60).toString().padStart(2, "0");
  const minute = (Math.floor(delta / 60) % 60).toString().padStart(2, "0");
  const hours = Math.floor(delta / 3600);

  return (
    <div className="flex flex-col">
      {timestamp.toLocaleString("sv", {
        hour: "numeric",
        minute: "numeric",
      })}
      <span className="text-xs font-medium tabular-nums text-gray-500">
        {hours}:{minute}:{second} sedan
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
  const { data, mutate, isPending, isSuccess, isError } = useMutation({
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
    <div className="flex flex-col items-center justify-center">
      <Icon invalid={invalid} alreadyScanned={data?.already_scanned ?? false} />
      {data && (
        <table className="w-full">
          {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
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
        </table>
      )}
    </div>
  );
}
