import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import QueryClientProvider from "@/components/QueryClientProvider";
import { PropsWithChildren } from "react";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});


export default function RootLayout({ children }: PropsWithChildren<{}>) {
  return (
    <QueryClientProvider>
      <html
        lang="sv"
        className={`${inter.variable} ${jetbrains.variable} min-h-full`}
      >
        <body>{children}</body>
        <Analytics />
      </html>
    </QueryClientProvider>
  );
}
