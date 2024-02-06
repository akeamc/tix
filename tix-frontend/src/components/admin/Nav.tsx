"use client";

import { GoogleLoginButton, useAuth } from "../auth";
import Link from "next/link";
import Button from "../Button";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";
import Modal from "../Modal";
import { Dialog } from "@headlessui/react";

export default function Nav() {
  const { identity, authenticated, unauthenticated } = useAuth();
  const router = useRouter();

  function onLogoutClick() {
    logout().then(() => {
      router.push("/");
    });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <nav>
        <ul className="flex items-center gap-8 text-sm font-medium">
          <li>
            <Link href="/admin">Start</Link>
          </li>
          <li>
            <Link href="/admin/orders">Ordrar</Link>
          </li>
        </ul>
      </nav>
      {authenticated && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{identity?.email}</span>
          <Button onClick={onLogoutClick}>Logga ut</Button>
        </div>
      )}
      <Modal open={unauthenticated} onClose={() => router.push("/")}>
        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            <Dialog.Title
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              Logga in
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Logga in med ett @sodralat.in-googlekonto.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center bg-gray-50 px-4 py-3 sm:px-6">
          <GoogleLoginButton />
        </div>
      </Modal>
    </header>
  );
}
