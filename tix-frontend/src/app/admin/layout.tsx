import Nav from "@/components/admin/Nav";
import { GSIProvider } from "@/components/auth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GSIProvider>
      <Nav />
      <main className="p-4">{children}</main>
    </GSIProvider>
  );
}
