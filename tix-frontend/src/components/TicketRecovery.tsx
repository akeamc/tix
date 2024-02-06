import { getOrder } from "@/lib/api";
import { useOrderStore } from "@/lib/state";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function TicketRecovery() {
  const [notFound, setNotFound] = useState(false);
  const { details, setDetails } = useOrderStore();
  const searchParams = useSearchParams();
  const [id, setId] = useState(searchParams.get("id") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const order = await getOrder(id, email);
    setNotFound(!order);
    if (order) {
      setDetails(order);
    }
  }

  return (
    <div>
      <h1>Hämta biljett</h1>
      <form onSubmit={onSubmit}>
        <label>
          E-post
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Ordernummer
          <input
            type="text"
            name="id"
            placeholder="ABCDEFGH"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </label>
        <button type="submit">Hämta biljetter</button>
      </form>
    </div>
  );
}
