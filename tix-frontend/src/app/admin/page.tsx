import { GoogleLoginButton } from "@/components/auth";
import Link from "next/link";

export default function AdminHome() {
  return (
    <>
      <GoogleLoginButton />
      <Link href="/admin/orders">
        Ordrar
      </Link>
    </>
  )
}
