import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import QueryClientProvider from "@/components/QueryClientProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider>
      <html
        lang="sv"
        className={`${inter.variable} ${jetbrains.variable} min-h-full bg-black text-white`}
      >
        <body>{children}</body>
      </html>
    </QueryClientProvider>
  );
}
