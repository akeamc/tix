import { SwishPayment } from "@/app/api/qr/route";
import classNames from "classnames";
import { PropsWithChildren } from "react";

export interface SwishQrProps {
  payee: string;
  amount: number;
  message: string;
}

function Field({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div>
      <h2 className="text-xs font-medium text-gray-700">{label}</h2>
      {children}
    </div>
  );
}

export function formatPhone(phone: string) {
  if (phone.length !== 10) return phone;
  const groups = phone.match(/(\d{3})(\d{3})(\d{2})(\d{2})/);
  if (!groups) return phone;
  return `${groups[1]}-${groups[2]}\xa0${groups[3]}\xa0${groups[4]}`;
}

export default function SwishQr({ payee, amount, message }: SwishQrProps) {
  const src = `/api/qr?payee=${encodeURIComponent(
    payee,
  )}&amount=${amount}&message=${encodeURIComponent(message)}`;

  const payment = {
    version: 1,
    payee: {
      value: payee,
    },
    amount: {
      value: amount,
    },
    message: {
      value: message,
      editable: false,
    },
  };

  return (
    <div className="flex gap-4 max-sm:flex-col">
      <a
        href={`swish://payment?data=${encodeURIComponent(
          JSON.stringify(payment),
        )}`}
        className="rounded-lg bg-black p-4 text-center text-lg font-medium text-white shadow-sm sm:hidden"
      >
        Öppna Swish
      </a>
      <div className="aspect-square overflow-hidden rounded-xl border bg-white shadow-sm max-sm:hidden sm:basis-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={classNames("m-[8%] aspect-square shrink-0")}
          src={src}
          alt="Swish QR code"
        />
      </div>
      <section className="grow">
        <Field label="Mottagare">{formatPhone(payee)}</Field>
        <hr className="my-2 border-gray-200" />
        <Field label="Belopp">
          {amount.toLocaleString("sv", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          &nbsp;kr
        </Field>
        <hr className="my-2 border-gray-200" />
        <Field label="Meddelande">{message}</Field>
      </section>
    </div>
  );
}
