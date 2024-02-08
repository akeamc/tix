import OrderView from "@/components/OrderView";
import { Order, getOrder } from "@/lib/api";

export default async function Page({
  searchParams: { email, id },
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let order: Order | null = null;
  if (id && email) {
    order = await getOrder(id.toString(), email.toString());
  }

  return (
    <main>
      <OrderView order={order ?? undefined} />
    </main>
  );
}
