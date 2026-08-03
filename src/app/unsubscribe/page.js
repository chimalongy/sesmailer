"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const domain = searchParams.get("domain");

  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!email) {
      setStatus("error");
      setErrorMsg("No email address provided in unsubscribe request.");
      return;
    }

    fetch(`/api/unsubscribe?email=${encodeURIComponent(email)}${domain ? `&domain=${encodeURIComponent(domain)}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Failed to process unsubscribe request.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Network error while processing unsubscribe request.");
      });
  }, [email, domain]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center">
        
        {/* Logo / Brand Header */}
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-6">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {status === "loading" && (
          <div className="space-y-3 py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
            <p className="text-sm text-zinc-400">Processing your unsubscribe request...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">You Have Been Unsubscribed</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">{email}</strong> has been removed from future email outreach
              {domain ? <span> regarding <strong className="text-indigo-400">{domain}</strong></span> : ""}.
            </p>
            <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              You will not receive any further automated emails from our domain desk.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Unsubscribe Status</h1>
            <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-xl p-3">
              {errorMsg}
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-800/40 flex justify-center">
          <Link
            href="/"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>&larr;</span> Return to Genius Domains
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
