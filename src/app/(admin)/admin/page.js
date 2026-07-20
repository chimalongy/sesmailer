"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("genius_admin_session");
    if (isLoggedIn === "true") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/admin/auth");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );
}
