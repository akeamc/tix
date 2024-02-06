import Checkout from "@/components/Checkout";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:bg-gray-50">
      <main className="mx-auto w-full max-w-lg sm:rounded-xl sm:border sm:bg-white sm:p-4">
        <Checkout />
      </main>
    </div>
  );
}
