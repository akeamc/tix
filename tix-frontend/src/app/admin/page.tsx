import Orders from "@/components/admin/Orders";
import { GoogleLoginButton } from "@/components/auth";

export default function AdminHome() {
  return (
    <>
      <GoogleLoginButton />
      <Orders />
    </>
  )
}
