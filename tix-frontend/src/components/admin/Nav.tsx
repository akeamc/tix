"use client";

import { useState } from "react";
import { useAuth } from "../auth";

export default function Nav() {
  const [showMenu, setShowMenu] = useState(false);
  const { identity } = useAuth();

  return <nav className="">{identity?.email}</nav>;
}
