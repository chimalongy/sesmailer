"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminAuth() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("genius_admin_session");
    if (isLoggedIn === "true") {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Demo credentials validation
      if (credentials.username === "admin" && credentials.password === "admin") {
        localStorage.setItem("genius_admin_session", "true");
        router.push("/admin/dashboard");
      } else {
        setError("Invalid username or password. Please use admin / admin.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-12 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-600/5"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-500/10 blur-[120px] dark:bg-violet-600/5"></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-3xl p-8 shadow-xl shadow-zinc-200/20 dark:shadow-black/50 relative z-10">
        {/* Brand/Heading */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xl shadow-md">
              G
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-905 dark:text-white">
              Genius<span className="text-indigo-600 dark:text-indigo-400 font-semibold">Admin</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            Portal Log In
          </h1>
          <p className="text-sm text-zinc-550 dark:text-zinc-400 mt-2 text-center">
            Log in to manage your premium domain portfolio and respond to inquiries.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/25 border border-rose-100/50 dark:border-rose-900/15 p-3.5 text-xs font-semibold text-rose-600 dark:text-rose-455">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={credentials.username}
              onChange={handleChange}
              placeholder="e.g. admin"
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={credentials.password}
              onChange={handleChange}
              placeholder="e.g. admin"
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Authenticating...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-100/60 dark:border-zinc-800/30 pt-5">
          <Link
            href="/"
            className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-450 dark:hover:text-indigo-400 flex items-center justify-center gap-1 group"
          >
            <span>&larr;</span> Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
