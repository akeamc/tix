import {
  CreateOrder,
  Order,
  createOrder,
  getTicketsRemaining,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

function Field({
  label,
  note,
  ...props
}: {
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  note?: string;
}) {
  return (
    <label className="block">
      <p className="mb-1 text-sm font-medium">{label}</p>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-200 p-2 text-sm"
        required
      />
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </label>
  );
}

function QuantityField({
  value,
  onChange,
  price,
}: {
  value: number;
  onChange: (value: number) => void;
  price: number;
}) {
  return (
    <div>
      <label className="block">
        <p className="mb-1 text-sm font-medium">Antal biljetter</p>
        <p className="flex items-center gap-2">
          <input
            type="number"
            name="count"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-200 p-2 text-sm"
            min={1}
            max={10}
            required
          />
          <span className="grow whitespace-nowrap">à {price}&nbsp;kr</span>
        </p>
      </label>
      <p className="mt-1 text-xs text-gray-500">
        I biljettpriset ingår garderob.
      </p>
    </div>
  );
}

export default function OrderForm(props: { onCreate: (order: Order) => void }) {
  const { data: ticketsRemaining } = useQuery({
    queryKey: ["ticketsRemaining"],
    queryFn: getTicketsRemaining,
  });
  const [count, setCount] = useState(1);
  const price = 115;
  const total = price * count;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    createOrder({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      count,
    })
      .then(props.onCreate)
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => setCreating(false));
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <section>
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight">
          STHLM VISION
        </h1>
        <p className="text-center text-gray-700">
          Fryshuset 10 februari kl. 18:30
        </p>
        <p className="mt-2 text-center text-gray-700">
          {ticketsRemaining ?? "-"} biljetter kvar
        </p>
      </section>
      <QuantityField value={count} onChange={setCount} price={price} />
      <hr />
      <Field
        name="name"
        label="Namn"
        type="text"
        placeholder="Gabriella Björk"
      />
      <Field
        name="email"
        label="E-postadress"
        type="email"
        placeholder="elevkaren@sodralat.in"
        note="Dina biljetter kommer skickas hit."
      />
      <Field
        name="phone"
        label="Telefonnummer"
        type="tel"
        placeholder="070-123 45 67"
      />
      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-red-500">{error}</p>
      )}
      <button
        disabled={creating || ticketsRemaining === 0}
        className="rounded-lg bg-black px-4 py-3 text-sm font-medium text-white"
      >
        Betala ({total}&nbsp;kr) -&gt;
      </button>
    </form>
  );
}
