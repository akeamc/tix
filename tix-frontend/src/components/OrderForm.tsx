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
      <p className="mb-1 font-medium text-sm">{label}</p>
      <input
        {...props}
        className="border-gray-200 border p-2 rounded-lg text-sm w-full"
        required
      />
      {note && <p className="text-gray-500 text-xs mt-1">{note}</p>}
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
        <p className="mb-1 font-medium text-sm">Antal biljetter</p>
        <p className="flex items-center gap-2">
          <input
            type="number"
            name="count"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="border-gray-200 border p-2 rounded-lg text-sm w-full"
            min={1}
            max={10}
            required
          />
          <span className="grow whitespace-nowrap">à {price}&nbsp;kr</span>
        </p>
      </label>
      <p className="text-gray-500 text-xs mt-1">
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
        <h1 className="text-4xl font-bold text-center tracking-tight mb-2">
          STHLM VISION
        </h1>
        <p className="text-center text-gray-700">
          Fryshuset 10 februari kl. 18:30
        </p>
        <p className="text-center mt-2 text-gray-700">
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
        <p className="text-red-500 p-2 rounded-lg bg-red-50">{error}</p>
      )}
      <button
        disabled={creating || ticketsRemaining === 0}
        className="bg-black text-white rounded-lg px-4 py-3 text-sm font-medium"
      >
        Betala ({total}&nbsp;kr) -&gt;
      </button>
    </form>
  );
}
