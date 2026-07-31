"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardOverview() {
  const [domainCount, setDomainCount] = useState(null);
  const [outboundCount, setOutboundCount] = useState(null);
  const [personaCount, setPersonaCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/domains").then((r) => r.json()),
      fetch("/api/outbounds").then((r) => r.json()),
      fetch("/api/personas").then((r) => r.json())
    ])
      .then(([domainsRes, outboundsRes, personasRes]) => {
        if (domainsRes.status === "fulfilled" && Array.isArray(domainsRes.value)) {
          setDomainCount(domainsRes.value.length);
        } else {
          setDomainCount(0);
        }

        if (outboundsRes.status === "fulfilled" && Array.isArray(outboundsRes.value)) {
          setOutboundCount(outboundsRes.value.length);
        } else {
          setOutboundCount(0);
        }

        if (personasRes.status === "fulfilled" && Array.isArray(personasRes.value)) {
          setPersonaCount(personasRes.value.length);
        } else {
          setPersonaCount(0);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Overview Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Monitor domain portfolio inventory, cold outreach campaigns, and sender personas.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Domains */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Domains</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="inline-block h-9 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{domainCount ?? "0"}</span>
            )}
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">Portfolio</span>
          </div>
        </div>

        {/* Outbound Campaigns */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Outbound Campaigns</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="inline-block h-9 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{outboundCount ?? "0"}</span>
            )}
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded">Campaigns</span>
          </div>
        </div>

        {/* Outreach Personas */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sender Personas</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="inline-block h-9 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{personaCount ?? "0"}</span>
            )}
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded">Senders</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Link
          href="/admin/dashboard/outbounds"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Outbound Campaigns &rarr;
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Manage automated cold outreach sequences</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/dashboard/verify-email"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Email Deliverability Verifier &rarr;
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Run 8-stage verification check on emails</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/dashboard/portfolio"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:border-violet-500/40 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Portfolio Inventory &rarr;
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Manage domain assets & pricing</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
