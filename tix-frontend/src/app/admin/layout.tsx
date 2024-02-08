import { GSIProvider } from "@/components/auth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GSIProvider>{children}</GSIProvider>;
}
