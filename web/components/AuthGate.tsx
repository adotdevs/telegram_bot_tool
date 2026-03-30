"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ok, setOk] = useState(path === "/login");

  useEffect(() => {
    if (path === "/login") {
      setOk(true);
      return;
    }
    const t = localStorage.getItem("token");
    if (!t) {
      router.replace("/login");
      return;
    }
    setOk(true);
  }, [path, router]);

  if (!ok && path !== "/login") return null;
  return <>{children}</>;
}
