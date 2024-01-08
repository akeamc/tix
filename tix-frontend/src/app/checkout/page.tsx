import Checkout from "@/components/Checkout";

export default function Page() {
  return (
    <div className="p-8 bg-white sm:bg-gray-50 text-black min-h-screen flex flex-col items-center justify-center">
      <main className="sm:p-4 sm:bg-white sm:border sm:rounded-xl w-full max-w-lg mx-auto">
        <Checkout />
      </main>
    </div>
  );
}
