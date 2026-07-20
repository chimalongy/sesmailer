"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Pre-seeded mock inquiries
const defaultInquiries = [
  {
    id: "inq-1",
    name: "Jane Smith",
    email: "jane@flowventures.ai",
    domain: "quantumflow.ai",
    offerPrice: "12,500",
    message: "We are building an agentic AI workflow product and this domain is a perfect fit. Is the domain available for instant transfer, and is this price within your range?",
    date: "2026-07-06",
    status: "New"
  },
  {
    id: "inq-2",
    name: "Alex Rivera",
    email: "alex@finverge.io",
    domain: "finverge.io",
    offerPrice: "15,000",
    message: "Interested in a lease-to-own structure over 12 months. Do you support DAN escrow installments?",
    date: "2026-07-05",
    status: "Reviewed"
  },
  {
    id: "inq-3",
    name: "David Chen",
    email: "d.chen@healthspire.org",
    domain: "healthspire.com",
    offerPrice: "9,000",
    message: "Looking to acquire this domain for a digital health portal. We are ready to open escrow immediately.",
    date: "2026-07-04",
    status: "Responded"
  }
];

export default function AdminDashboardOverview() {
  const [inquiries, setInquiries] = useState([]);
  const [domainCount, setDomainCount] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  useEffect(() => {
    // 1. Get Domains Count
    setLoadingDomains(true);
    fetch("/api/domains")
      .then((res) => {
        if (!res.ok) throw new Error("Domains fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDomainCount(data.length);
        }
      })
      .catch((err) => {
        console.error("Failed to load domain count:", err);
        setDomainCount(0);
      })
      .finally(() => {
        setLoadingDomains(false);
      });

    // 2. Get Inquiries
    setLoadingInquiries(true);
    fetch("/api/inquiries")
      .then((res) => {
        if (!res.ok) throw new Error("Inquiries fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setInquiries(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load inquiries:", err);
      })
      .finally(() => {
        setLoadingInquiries(false);
      });
  }, []);

  const handleUpdateStatus = (id, newStatus) => {
    fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update status");
        return res.json();
      })
      .then(() => {
        const updated = inquiries.map((inq) => {
          if (inq.id === id) {
            return { ...inq, status: newStatus };
          }
          return inq;
        });
        setInquiries(updated);
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }
      })
      .catch((err) => {
        console.error("Inquiry status update failed:", err);
        alert("Failed to update status.");
      });
  };

  const handleDeleteInquiry = (id) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      fetch(`/api/inquiries/${id}`, {
        method: "DELETE"
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete inquiry");
          return res.json();
        })
        .then(() => {
          const updated = inquiries.filter((inq) => inq.id !== id);
          setInquiries(updated);
          setSelectedInquiry(null);
        })
        .catch((err) => {
          console.error("Inquiry deletion failed:", err);
          alert("Failed to delete inquiry.");
        });
    }
  };

  // Calculate Metrics
  const activeOffers = inquiries.filter((inq) => inq.offerPrice && parseFloat(inq.offerPrice.replace(/,/g, "")) > 0);
  const totalOfferVolume = activeOffers.reduce((sum, inq) => sum + parseFloat(inq.offerPrice.replace(/,/g, "") || 0), 0);
  const avgOfferPrice = activeOffers.length > 0 ? Math.round(totalOfferVolume / activeOffers.length) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Overview Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-zinc-550 dark:text-zinc-400">
          Monitor your domain inventory statistics and active buyer inquiries.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            {loadingDomains ? (
              <span className="inline-block h-9 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{domainCount ?? "—"}</span>
            )}
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Inquiries</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {loadingInquiries ? (
              <span className="inline-block h-9 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{inquiries.length}</span>
            )}
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded">Leads</span>
          </div>
        </div>

        {/* Average Offer */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Average Offer</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {loadingInquiries ? (
              <span className="inline-block h-9 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                ${avgOfferPrice.toLocaleString()}
              </span>
            )}
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">USD</span>
          </div>
        </div>

        {/* Active Volume */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Offer Pipeline</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {loadingInquiries ? (
              <span className="inline-block h-9 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                ${totalOfferVolume.toLocaleString()}
              </span>
            )}
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Pipeline</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="inquiries" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lead Table Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Active Buyer Inquiries
              </h3>
              <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {inquiries.length} Inquiries
              </span>
            </div>

            {loadingInquiries ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th className="py-3 px-6">Sender</th>
                      <th className="py-3 px-6">Target Domain</th>
                      <th className="py-3 px-6 text-right">Offer (USD)</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="py-4 px-6">
                          <span className="block h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse mb-1.5" />
                          <span className="block h-2.5 w-36 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                        </td>
                        <td className="py-4 px-6"><span className="block h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" /></td>
                        <td className="py-4 px-6 text-right"><span className="inline-block h-3.5 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" /></td>
                        <td className="py-4 px-6 text-center"><span className="inline-block h-5 w-16 rounded-md bg-zinc-200 dark:bg-zinc-700 animate-pulse" /></td>
                        <td className="py-4 px-6 text-right"><span className="inline-block h-6 w-20 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : inquiries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th className="py-3 px-6">Sender</th>
                      <th className="py-3 px-6">Target Domain</th>
                      <th className="py-3 px-6 text-right">Offer (USD)</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {inquiries.map((inq) => (
                      <tr
                        key={inq.id}
                        className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors text-sm ${
                          selectedInquiry && selectedInquiry.id === inq.id ? "bg-zinc-50 dark:bg-zinc-850/30" : ""
                        }`}
                      >
                        <td className="py-4 px-6 font-medium text-zinc-900 dark:text-white">
                          <div>
                            <span className="block">{inq.name}</span>
                            <span className="block text-xs text-zinc-450 dark:text-zinc-550">{inq.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-650 dark:text-zinc-450 font-semibold">
                          {inq.domain || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-zinc-900 dark:text-white">
                          {inq.offerPrice ? `$${parseFloat(inq.offerPrice.replace(/,/g, "")).toLocaleString()}` : "N/A"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                              inq.status === "New"
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                : inq.status === "Reviewed"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {inq.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedInquiry(inq)}
                            className="inline-flex justify-center rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 px-2 py-1 text-xs font-semibold cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDeleteInquiry(inq.id)}
                            className="inline-flex justify-center rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 px-2.5 py-1 text-xs font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-450 dark:text-zinc-550">
                No active domain inquiries found.
              </div>
            )}
          </div>
        </div>

        {/* Lead Details Column */}
        <div className="lg:col-span-1">
          {selectedInquiry ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-6 space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Inquiry Details</h3>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-550 dark:hover:text-zinc-350 cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Date</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{selectedInquiry.date}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Buyer</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{selectedInquiry.name}</span>
                  <span className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email}</a>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Domain Name</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{selectedInquiry.domain || "General contact"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Offered Price</span>
                  <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
                    {selectedInquiry.offerPrice ? `$${parseFloat(selectedInquiry.offerPrice.replace(/,/g, "")).toLocaleString()}` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Inquiry Message</span>
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed overflow-y-auto max-h-40">
                    {selectedInquiry.message}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex flex-col gap-2">
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">Update Status</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedInquiry.id, "New")}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedInquiry.status === "New"
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-450 hover:bg-zinc-50"
                      }`}
                    >
                      New
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedInquiry.id, "Reviewed")}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedInquiry.status === "Reviewed"
                          ? "bg-amber-600 border-amber-600 text-white"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-455 hover:bg-zinc-50"
                      }`}
                    >
                      Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedInquiry.id, "Responded")}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedInquiry.status === "Responded"
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-450 hover:bg-zinc-50"
                      }`}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-6 text-center text-zinc-400 dark:text-zinc-550 py-16 sticky top-24">
              Select an inquiry to view purchase message details and update status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
