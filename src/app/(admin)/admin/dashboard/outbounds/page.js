"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminOutbounds() {
  const [outbounds, setOutbounds] = useState([]);
  const [filter, setFilter] = useState("All");

  const fetchOutbounds = () => {
    fetch("/api/outbounds")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch campaigns");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setOutbounds(data);
        }
      })
      .catch((err) => {
        console.error("Error loading outbounds from database:", err);
      });
  };

  useEffect(() => {
    fetchOutbounds();
  }, []);

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear all outbound campaign logs?")) {
      fetch("/api/outbounds?mode=clear", { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to clear logs");
          return res.json();
        })
        .then(() => {
          setOutbounds([]);
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to clear campaign logs.");
        });
    }
  };

  const handleResetLogs = () => {
    if (window.confirm("Are you sure you want to restore default mock campaign logs?")) {
      fetch("/api/outbounds?mode=reset", { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to reset logs");
          return res.json();
        })
        .then(() => {
          fetchOutbounds();
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to restore default mock logs.");
        });
    }
  };

  const handleDeleteCampaign = (domain) => {
    if (window.confirm(`Are you sure you want to delete the outreach campaign for "${domain}"?`)) {
      fetch(`/api/outbounds/${encodeURIComponent(domain)}`, {
        method: "DELETE"
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to delete campaign");
          }
          return res.json();
        })
        .then(() => {
          fetchOutbounds();
        })
        .catch((err) => {
          console.error("Delete campaign error:", err);
          alert(`Failed to delete campaign: ${err.message}`);
        });
    }
  };

  // Filter outbounds
  const filteredOutbounds = outbounds.filter((out) => {
    if (filter === "All") return true;
    return out.status === filter;
  });

  // Calculate Metrics
  const totalSent = outbounds.length;
  const opened = outbounds.filter((o) => o.status === "Opened" || o.status === "Replied").length;
  const replied = outbounds.filter((o) => o.status === "Replied").length;
  const bounced = outbounds.filter((o) => o.status === "Bounced").length;

  const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0;
  const responseRate = totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Outbound Mail Desk
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Monitor AI outreach cold email campaigns and prospect engagement metrics.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/dashboard/outbounds/send"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow active:scale-95 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Single Email
          </Link>
          <button
            onClick={handleResetLogs}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200/50 dark:border-zinc-800/30 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
          >
            Reset Logs
          </button>
          <button
            onClick={handleClearLogs}
            className="inline-flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/10 dark:hover:bg-rose-955/30 dark:text-rose-400 px-4 py-2 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
          >
            Clear Logs
          </button>
        </div>

      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/25 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Total Contacted</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{totalSent}</div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">Scheduled pitches sent</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/25 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Average Open Rate</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{openRate}%</div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-505 mt-2">{opened} opened messages</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/25 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Response Rate</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{responseRate}%</div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-505 mt-2">{replied} buyer responses</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/25 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Bounces</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-505">{bounced}</div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">Undeliverable addresses</p>
        </div>
      </div>

      {/* Campaign Log Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/20 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="px-6 py-5 border-b border-zinc-100/80 dark:border-zinc-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Outreach Campaigns ({filteredOutbounds.length})</h3>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            {["All", "Sent", "Opened", "Replied", "Bounced"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                  filter === status
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200/40 dark:border-zinc-800/30 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {filteredOutbounds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <th className="py-3 px-6">Domain</th>
                  <th className="py-3 px-6">Prospect Verticals</th>
                  <th className="py-3 px-6">Campaign Subject</th>
                  <th className="py-3 px-6">Template</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-center">Engagement</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredOutbounds.map((out) => (
                  <tr key={out.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-zinc-900 dark:text-white font-mono">
                      <Link
                        href={`/admin/dashboard/outbounds/${out.domain}`}
                        className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                      >
                        {out.domain}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-zinc-650 dark:text-zinc-400 font-medium">
                      {out.industry}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 max-w-[240px] truncate">
                      {out.tasks?.[0]?.task_subject || "Strategic domain proposal"}
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      {out.template}
                    </td>
                    <td className="py-4 px-6 text-zinc-500">
                      {out.date}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          out.status === "Sent"
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                            : out.status === "Opened"
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                            : out.status === "Replied"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {out.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link
                          href={`/admin/dashboard/outbounds/${out.domain}`}
                          className="inline-flex justify-center rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-2.5 py-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteCampaign(out.domain)}
                          className="inline-flex justify-center rounded bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/15 dark:hover:bg-rose-955/35 dark:text-rose-400 px-2.5 py-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all border border-rose-200/20 dark:border-rose-900/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
            No outbound campaigns fit the selected status filter.
          </div>
        )}
      </div>
    </div>
  );
}
