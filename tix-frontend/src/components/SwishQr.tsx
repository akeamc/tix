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
      <h2 className="font-medium text-gray-700 text-xs">{label}</h2>
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
    <div className="flex max-sm:flex-col gap-4">
      <a
        href={`swish://payment?data=${encodeURIComponent(
          JSON.stringify(payment),
        )}`}
        className="sm:hidden bg-black text-white shadow-sm p-4 rounded-lg text-lg font-medium text-center"
      >
        Öppna Swish
      </a>
      <div className="border rounded-xl overflow-hidden bg-white aspect-square shadow-sm sm:basis-64 max-sm:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={classNames("aspect-square m-[8%] shrink-0")}
          src={src}
          alt="Swish QR code"
        />
      </div>
      <section className="grow">
        <Field label="Mottagare">{formatPhone(payee)}</Field>
        <hr className="border-gray-200 my-2" />
        <Field label="Belopp">
          {amount.toLocaleString("sv", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          &nbsp;kr
        </Field>
        <hr className="border-gray-200 my-2" />
        <Field label="Meddelande">{message}</Field>
      </section>
    </div>
  );
}
