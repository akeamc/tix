import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-black text-white">
      <main className="mx-auto flex min-h-screen max-w-screen-lg flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-6 text-8xl font-bold leading-none tracking-tight md:mb-8 md:text-9xl">
          STHLM VISION 2024
        </h1>
        <p className="mb-6 text-lg text-gray-300 md:mb-8">
          Fryshuset 10 februari
        </p>
        <Link
          href="/checkout"
          className="inline-block rounded-lg bg-white px-6 py-3 text-center font-medium text-black hover:outline hover:outline-offset-2 hover:outline-white md:px-8 md:py-4 md:text-xl"
        >
          Köp biljetter
        </Link>
        {/* <Link href="/tickets" className="text-gray-300 text-sm underline mt-4">
        Visa köpta biljetter
      </Link> */}
      </main>
    </div>
  );
}
