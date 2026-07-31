"use client";

import { useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [activeTab, setActiveTab] = useState("single"); // "single" | "bulk"

  // ── Single Mode State ──────────────────────────────────────────────────────
  const [singleEmail, setSingleEmail] = useState("");
  const [verifyingSingle, setVerifyingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState(null); // { result, durationMs }
  const [singleError, setSingleError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  // ── Bulk Mode State ────────────────────────────────────────────────────────
  const [bulkText, setBulkText] = useState("");
  const [verifyingBulk, setVerifyingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { total, valid, risky, invalid, durationMs }
  const [bulkError, setBulkError] = useState(null);
  const [bulkFilter, setBulkFilter] = useState("all"); // "all" | "valid" | "risky" | "invalid"
  const [copiedStatus, setCopiedStatus] = useState(false);

  // ── Handle Single Email Verification ───────────────────────────────────────
  const handleVerifySingle = async (e) => {
    e?.preventDefault();
    if (!singleEmail.trim()) return;

    setVerifyingSingle(true);
    setSingleResult(null);
    setSingleError(null);

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: singleEmail.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        setSingleError(data.error || "Failed to verify email.");
      } else {
        setSingleResult(data);
      }
    } catch (err) {
      setSingleError(err.message || "Network error occurred.");
    } finally {
      setVerifyingSingle(false);
    }
  };

  // ── Handle Bulk Verification ───────────────────────────────────────────────
  const handleVerifyBulk = async (e) => {
    e?.preventDefault();
    const emailsList = bulkText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));

    if (emailsList.length === 0) {
      setBulkError("Please input at least one valid email address.");
      return;
    }

    setVerifyingBulk(true);
    setBulkResult(null);
    setBulkError(null);

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailsList })
      });

      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Failed to process bulk verification.");
      } else {
        setBulkResult(data);
      }
    } catch (err) {
      setBulkError(err.message || "Network error occurred.");
    } finally {
      setVerifyingBulk(false);
    }
  };

  // ── Copy Valid Emails to Clipboard ──────────────────────────────────────────
  const handleCopyValidEmails = () => {
    if (!bulkResult || !bulkResult.valid) return;
    const validEmailsText = bulkResult.valid.map((r) => r.email).join("\n");
    navigator.clipboard.writeText(validEmailsText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 flex items-center gap-1.5 group transition-colors"
            >
              <svg className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Admin Dashboard
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
              Email Deliverability Tool
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Email Deliverability Verifier
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Check email syntax, domain MX records, disposable provider detection, and live SMTP handshakes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "single"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Single Email Check
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "bulk"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Bulk List Verifier
          </button>
        </div>
      </div>

      {/* ── TABS SECTION 1: SINGLE EMAIL VERIFIER ─────────────────────────────── */}
      {activeTab === "single" && (
        <div className="space-y-6">
          {/* Verification Form Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Single Email Verification
            </h2>

            <form onSubmit={handleVerifySingle} className="space-y-4">
              <div>
                <label htmlFor="single-email-input" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address to Verify *
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="single-email-input"
                    type="email"
                    required
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="e.g. s.jenkins@aethercloud.io or test@gmail.com"
                    className="flex-1 rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={verifyingSingle || !singleEmail.trim()}
                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    {verifyingSingle ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verify Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Preset Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-zinc-400">Quick Test Samples:</span>
                {[
                  "s.jenkins@aethercloud.io",
                  "contact@dispostable.com",
                  "nonexistent12345@gmail.com"
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setSingleEmail(sample);
                    }}
                    className="text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-mono"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>

            {/* Error Banner */}
            {singleError && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {singleError}
              </div>
            )}
          </div>

          {/* Results Breakdown Card */}
          {singleResult && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-6 animate-scale-up">
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Verification Outcome
                  </span>
                  <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white font-mono mt-0.5">
                    {singleResult.result.email}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    Checked in {singleResult.durationMs}ms
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                      singleResult.result.verdict === "valid"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40"
                        : singleResult.result.verdict === "invalid"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40"
                    }`}
                  >
                    VERDICT: {singleResult.result.verdict.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 8-Step Pipeline Checklist Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Syntax Check */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">1. Syntax Check</span>
                    <span className={`text-xs font-black ${singleResult.result.syntaxCheck?.success ? "text-emerald-500" : "text-rose-500"}`}>
                      {singleResult.result.syntaxCheck?.success ? "PASSED ✓" : "FAILED ✕"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">RFC 5322 Email Syntax</p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.syntaxCheck?.message || "Standard format"}</p>
                </div>

                {/* 2. Disposable Domain Check */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">2. Disposable Filter</span>
                    <span className={`text-xs font-black ${singleResult.result.disposableCheck?.status === "valid" ? "text-emerald-500" : "text-amber-500"}`}>
                      {singleResult.result.disposableCheck?.status === "valid" ? "CLEAN ✓" : "DISPOSABLE ⚠"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {singleResult.result.domain || "N/A"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.disposableCheck?.message || "Throwaway database"}</p>
                </div>

                {/* 3. MX Record Lookup */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">3. MX Lookup</span>
                    <span className={`text-xs font-black ${singleResult.result.mxCheck?.status === "valid" ? "text-emerald-500" : singleResult.result.mxCheck?.status === "invalid" ? "text-rose-500" : "text-amber-500"}`}>
                      {singleResult.result.mxCheck?.status === "valid" ? "RESOLVED ✓" : singleResult.result.mxCheck?.status === "invalid" ? "MISSING ✕" : "UNKNOWN"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono font-medium truncate">
                    {singleResult.result.mxCheck?.details?.mxRecords?.[0]?.exchange || singleResult.result.domain || "N/A"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {singleResult.result.mxCheck?.details?.mxRecords?.length ? `${singleResult.result.mxCheck.details.mxRecords.length} host(s) found` : singleResult.result.mxCheck?.message || "No MX records"}
                  </p>
                </div>

                {/* 4. DNS A/AAAA Lookup */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">4. DNS A/AAAA Lookup</span>
                    <span className={`text-xs font-black ${singleResult.result.dnsCheck?.status === "valid" ? "text-emerald-500" : singleResult.result.dnsCheck?.status === "invalid" ? "text-rose-500" : "text-amber-500"}`}>
                      {singleResult.result.dnsCheck?.status === "valid" ? "RESOLVED ✓" : "NO IP ✕"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono font-medium truncate">
                    {singleResult.result.dnsCheck?.details?.aRecords?.[0] || singleResult.result.dnsCheck?.details?.aaaaRecords?.[0] || "No IP address"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.dnsCheck?.message || "Domain IP resolution"}</p>
                </div>

                {/* 5. Role Account Check */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">5. Role Account</span>
                    <span className={`text-xs font-black ${singleResult.result.roleAccountCheck?.status === "valid" ? "text-emerald-500" : "text-amber-500"}`}>
                      {singleResult.result.roleAccountCheck?.status === "valid" ? "PERSONAL ✓" : "ROLE MAILBOX ⚠"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {singleResult.result.roleAccountCheck?.details?.roleAccount ? `Role: ${singleResult.result.localPart}` : "Personal Local-Part"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.roleAccountCheck?.message || "Shared mailbox filter"}</p>
                </div>

                {/* 6. Known-Bad Domain Check */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">6. Known Bad Domain</span>
                    <span className={`text-xs font-black ${singleResult.result.knownBadDomainCheck?.status === "valid" ? "text-emerald-500" : "text-rose-500"}`}>
                      {singleResult.result.knownBadDomainCheck?.status === "valid" ? "CLEAN ✓" : "BAD DOMAIN ✕"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {singleResult.result.knownBadDomainCheck?.status === "valid" ? "Not Blacklisted" : "Spamtrap/Burner Domain"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.knownBadDomainCheck?.message || "Domain blacklist"}</p>
                </div>

                {/* 7. Historical Suppression Check */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">7. Suppression List</span>
                    <span className={`text-xs font-black ${singleResult.result.suppressionCheck?.status === "valid" ? "text-emerald-500" : singleResult.result.suppressionCheck?.status === "invalid" ? "text-rose-500" : "text-amber-500"}`}>
                      {singleResult.result.suppressionCheck?.status === "valid" ? "CLEAN ✓" : "SUPPRESSED ✕"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {singleResult.result.suppressionCheck?.details?.suppressed ? "In Unsubscribe Database" : "Not Suppressed"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.suppressionCheck?.message || "Suppression record"}</p>
                </div>

                {/* 8. Bounce History Check */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">8. Bounce History</span>
                    <span className={`text-xs font-black ${singleResult.result.bounceCheck?.status === "valid" ? "text-emerald-500" : singleResult.result.bounceCheck?.status === "invalid" ? "text-rose-500" : "text-amber-500"}`}>
                      {singleResult.result.bounceCheck?.status === "valid" ? "NO BOUNCE ✓" : singleResult.result.bounceCheck?.status === "invalid" ? "HARD BOUNCE ✕" : "SOFT BOUNCE ⚠"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {singleResult.result.bounceCheck?.details?.bounced ? "Previous Bounce Found" : "Clean Delivery Log"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{singleResult.result.bounceCheck?.message || "Bounce history record"}</p>
                </div>
              </div>

              {/* JSON Metrics Accordion Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  {showJson ? "Hide Raw Diagnostic Payload" : "View Raw Diagnostic Payload"}
                </button>
                {showJson && (
                  <pre className="mt-3 p-4 rounded-2xl bg-zinc-950 text-indigo-300 text-xs font-mono overflow-x-auto border border-zinc-800">
                    {JSON.stringify(singleResult, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TABS SECTION 2: BULK LIST VERIFIER ────────────────────────────────── */}
      {activeTab === "bulk" && (
        <div className="space-y-6">
          {/* Bulk Textarea Form Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Bulk Email List Verification
            </h2>

            <form onSubmit={handleVerifyBulk} className="space-y-4">
              <div>
                <label htmlFor="bulk-text-input" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Paste Target Email List *
                </label>
                <textarea
                  id="bulk-text-input"
                  rows={8}
                  required
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="e.g.&#10;s.jenkins@aethercloud.io&#10;contact@dispostable.com&#10;fake@nonexistentdomain123.org"
                  className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
                />
                <p className="text-[10px] text-zinc-400 mt-1 italic">
                  Format: Enter one email per line or separate by commas.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setBulkText("")}
                  className="rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-4 py-2.5 transition-all cursor-pointer"
                >
                  Clear List
                </button>
                <button
                  type="submit"
                  disabled={verifyingBulk || !bulkText.trim()}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {verifyingBulk ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying Batch...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify Email Batch
                    </>
                  )}
                </button>
              </div>
            </form>

            {bulkError && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {bulkError}
              </div>
            )}
          </div>

          {/* Bulk Results Summary Cards */}
          {bulkResult && (
            <div className="space-y-6 animate-scale-up">
              {/* Summary Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Processed</span>
                  <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">{bulkResult.total}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Valid Emails</span>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{bulkResult.validCount}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Risky / Unconfirmed</span>
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{bulkResult.riskyCount}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-rose-200/60 dark:border-rose-800/40 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Invalid / Bounced</span>
                  <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{bulkResult.invalidCount}</div>
                </div>
              </div>

              {/* Segmented Items Container */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: "all", label: `All (${bulkResult.total})` },
                      { id: "valid", label: `Valid (${bulkResult.validCount})` },
                      { id: "risky", label: `Risky (${bulkResult.riskyCount})` },
                      { id: "invalid", label: `Invalid (${bulkResult.invalidCount})` }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setBulkFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          bulkFilter === tab.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyValidEmails}
                    disabled={!bulkResult.valid || bulkResult.valid.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {copiedStatus ? "✓ Copied to Clipboard!" : `Copy Valid Emails (${bulkResult.validCount})`}
                  </button>
                </div>

                {/* Email List Table */}
                <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
                  {(bulkFilter === "all"
                    ? bulkResult.results
                    : bulkFilter === "valid"
                    ? bulkResult.valid
                    : bulkFilter === "risky"
                    ? bulkResult.risky
                    : bulkResult.invalid
                  ).map((item, idx) => (
                    <div
                      key={item.email || idx}
                      className="p-3.5 rounded-2xl bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="space-y-0.5 truncate">
                        <span className="font-bold text-zinc-900 dark:text-white truncate block">{item.email}</span>
                        <span className="text-[10px] text-zinc-400 font-sans">
                          {item.domain ? `MX: ${item.domain}` : "No MX host"}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full whitespace-nowrap ${
                          item.verdict === "valid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : item.verdict === "invalid"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                        }`}
                      >
                        {item.verdict?.toUpperCase() || "UNKNOWN"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
