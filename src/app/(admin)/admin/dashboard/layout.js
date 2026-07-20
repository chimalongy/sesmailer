"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("genius_admin_session");
    if (isLoggedIn !== "true") {
      router.push("/admin/auth");
    } else {
      setAuthorized(true);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("genius_admin_session");
    router.push("/admin/auth");
  };

  const menuItems = [
    { name: "Overview", href: "/admin/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Portfolio Manager", href: "/admin/dashboard/portfolio", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { name: "Outbounds", href: "/admin/dashboard/outbounds", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { name: "Personas", href: "/admin/dashboard/personas", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { name: "Templates", href: "/admin/dashboard/templates", icon: "M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2zM9 9h6m-6 4h6m-6 4h4" }
  ];

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-sm font-semibold text-zinc-500">Checking authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 hidden md:flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-base shadow-sm">
              G
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-905 dark:text-white">
              Genius<span className="text-indigo-600 dark:text-indigo-400 font-semibold">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100"
                }`}
              >
                <svg
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer text-left"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 flex items-center justify-between px-6 sm:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle (simple route selector) */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className={`p-2 text-xs font-semibold rounded-lg ${
                  pathname === "/admin/dashboard" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-550 dark:text-zinc-400"
                }`}
              >
                Overview
              </Link>
              <Link
                href="/admin/dashboard/portfolio"
                className={`p-2 text-xs font-semibold rounded-lg ${
                  pathname === "/admin/dashboard/portfolio" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-550 dark:text-zinc-400"
                }`}
              >
                Portfolio
              </Link>
              <Link
                href="/admin/dashboard/outbounds"
                className={`p-2 text-xs font-semibold rounded-lg ${
                  pathname.startsWith("/admin/dashboard/outbounds") ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-550 dark:text-zinc-400"
                }`}
              >
                Outbounds
              </Link>
              <Link
                href="/admin/dashboard/personas"
                className={`p-2 text-xs font-semibold rounded-lg ${
                  pathname.startsWith("/admin/dashboard/personas") ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-550 dark:text-zinc-400"
                }`}
              >
                Personas
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                Logout
              </button>
            </div>
            <h2 className="hidden md:block text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Welcome Back, Admin!
            </h2>
          </div>
          
          {/* User profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">System Broker</span>
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Administrator</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
