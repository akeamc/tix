import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-screen-lg flex flex-col items-center justify-center min-h-screen p-4 text-center bg-black text-white">
      <h1 className="text-8xl md:text-9xl font-bold tracking-tight leading-none mb-6 md:mb-8">
        STHLM VISION 2024
      </h1>
      <p className="text-lg text-gray-300 mb-6 md:mb-8">
        Fryshuset 10 februari
      </p>
      <Link
        href="/checkout"
        className="bg-white px-6 py-3 md:px-8 md:py-4 inline-block rounded-lg text-black md:text-xl font-medium text-center hover:outline hover:outline-offset-2 hover:outline-white"
      >
        Köp biljetter
      </Link>
      {/* <Link href="/tickets" className="text-gray-300 text-sm underline mt-4">
        Visa köpta biljetter
      </Link> */}
    </main>
  );
}
