"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function SendSingleEmail() {
  // ── Sender ──────────────────────────────────────────────────────────────────
  const [personas, setPersonas]                     = useState([]);
  const [selectedPersonaId, setSelectedPersonaId]   = useState("");

  // ── Templates ───────────────────────────────────────────────────────────────
  const [templates, setTemplates]                   = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [toEmail, setToEmail]                       = useState("");
  const [replyTo, setReplyTo]                       = useState("");
  const [subject, setSubject]                       = useState("");
  const [message, setMessage]                       = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [sending, setSending]                       = useState(false);
  const [result, setResult]                         = useState(null); // { success, error, messageId }
  const [missingConfig, setMissingConfig]           = useState(false);
  const [charCount, setCharCount]                   = useState(0);
  const [composeTab, setComposeTab]                 = useState("write"); // "write" | "preview"

  // ── Mobile Responsive Layout state ───────────────────────────────────────────
  const [composeCollapsed, setComposeCollapsed]     = useState(false);
  const [threadsCollapsed, setThreadsCollapsed]     = useState(false);
  const [activeMobileTab, setActiveMobileTab]       = useState("compose"); // "compose" | "threads"

  // ── Sent Single Emails History ──────────────────────────────────────────────
  const [sentEmails, setSentEmails]                 = useState([]);
  const [loadingHistory, setLoadingHistory]         = useState(true);
  const [selectedThread, setSelectedThread]         = useState(null);
  const [syncingReplies, setSyncingReplies]         = useState(false);
  const [syncMessage, setSyncMessage]               = useState(null);
  const [historyFilter, setHistoryFilter]           = useState("all"); // "all" | "replied"
  const [searchQuery, setSearchQuery]               = useState("");

  // ── Load personas & templates ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPersonas(data);
          if (data.length > 0) {
            setSelectedPersonaId(data[0].id);
            setReplyTo(data[0].email || data[0].replyToEmail || "");
          }
        }
      })
      .catch(() => {});

    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  // ── Derived: active persona ───────────────────────────────────────────────────
  const activePersona = personas.find((p) => p.id === selectedPersonaId) || null;

  const handlePersonaChange = (id) => {
    setSelectedPersonaId(id);
    const p = personas.find((item) => item.id === id);
    if (p) {
      setReplyTo(p.email || p.replyToEmail || "");
    }
  };

  // ── Apply template ────────────────────────────────────────────────────────────
  const handleTemplateChange = (id) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const personaName = activePersona?.name || "Portfolio Manager";
    const compiled = (text) =>
      text
        .replaceAll("[personaName]", personaName)
        .replaceAll("[domain]", "")
        .replaceAll("\\n", "\n");
    setSubject(compiled(tpl.subject));
    setMessage(compiled(tpl.message));
    setCharCount(compiled(tpl.message).length);
  };

  // ── Send ──────────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!toEmail || !subject || !message) return;

    setSending(true);
    setResult(null);

    const persona = activePersona;

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:        toEmail.trim(),
          subject:   subject.trim(),
          message:   message.trim(),
          fromName:  persona?.name  || "",
          fromEmail: persona?.email || "",
          replyTo:   replyTo.trim() || persona?.replyToEmail || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.missingConfig) setMissingConfig(true);
        setResult({ success: false, error: data.error });
      } else {
        setResult({ success: true, messageId: data.messageId, to: toEmail });
        // Clear form on success
        setToEmail("");
        setReplyTo(persona?.email || persona?.replyToEmail || "");
        setSubject("");
        setMessage("");
        setCharCount(0);
        setSelectedTemplateId("");
        fetchHistory();
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const fetchHistory = useCallback((showLoading = true) => {
    if (showLoading) setLoadingHistory(true);
    fetch("/api/send-email")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSentEmails(data);
      })
      .catch(() => {})
      .finally(() => {
        if (showLoading) setLoadingHistory(false);
      });
  }, []);

  const handleSyncReplies = useCallback(async (silent = false) => {
    if (!silent) {
      setSyncingReplies(true);
      setSyncMessage(null);
    }
    try {
      const res = await fetch("/api/fetch-replies", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (!silent && data.count > 0) {
          setSyncMessage(data.message || `Synced ${data.count} replies`);
        }
        fetchHistory(!silent);
      } else if (!silent) {
        setSyncMessage(data.error || "Failed to sync replies");
      }
    } catch (err) {
      if (!silent) setSyncMessage(err.message);
    } finally {
      if (!silent) setSyncingReplies(false);
    }
  }, [fetchHistory]);

  // ── Auto-Sync & Polling Effect (Syncs S3 on load & every 30s) ───────────────
  useEffect(() => {
    fetchHistory(true);

    const timerId = setTimeout(() => {
      handleSyncReplies(true);
    }, 100);

    const intervalId = setInterval(() => {
      handleSyncReplies(true);
    }, 30000);

    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [fetchHistory, handleSyncReplies]);

  // ── Character count ───────────────────────────────────────────────────────────
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
  };

  // ── Filtered History Items ───────────────────────────────────────────────────
  const filteredSentEmails = sentEmails.filter((item) => {
    const messagesList = Array.isArray(item.messages)
      ? item.messages
      : typeof item.messages === "string"
      ? JSON.parse(item.messages)
      : [];
    const isReplied = item.status === "Replied" || messagesList.some((m) => m.sender === "prospect");

    if (historyFilter === "replied" && !isReplied) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTo = (item.to_email || "").toLowerCase().includes(q);
      const matchSubject = (item.subject || "").toLowerCase().includes(q);
      const matchFrom = (item.from_email || "").toLowerCase().includes(q);
      return matchTo || matchSubject || matchFrom;
    }
    return true;
  });

  const repliedCount = sentEmails.filter((item) => {
    const msgs = Array.isArray(item.messages)
      ? item.messages
      : typeof item.messages === "string"
      ? JSON.parse(item.messages)
      : [];
    return item.status === "Replied" || msgs.some((m) => m.sender === "prospect");
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard/outbounds"
              className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 flex items-center gap-1.5 group transition-colors"
            >
              <svg className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Outbound Mail Desk
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/30">
              Single Send Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Direct Outreach & Thread Desk
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Dispatch one-off emails via SendGrid and monitor prospect responses side-by-side.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-Sync Active (30s)
          </div>
          <button
            onClick={() => handleSyncReplies(false)}
            disabled={syncingReplies}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {syncingReplies ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Syncing S3...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </>
            )}
          </button>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-zinc-900 transition-all cursor-pointer shadow-xs"
            title="Refresh logs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on small screens) */}
      <div className="lg:hidden flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
        <button
          onClick={() => setActiveMobileTab("compose")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileTab === "compose"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Compose Email
        </button>
        <button
          onClick={() => setActiveMobileTab("threads")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileTab === "threads"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Sent Threads ({sentEmails.length})
        </button>
      </div>

      {/* Main Layout: Side by side on desktop (lg+), stacked/collapsible on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── LEFT COLUMN: Compose Form Section ──────────────────────────────── */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            activeMobileTab === "threads" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Section Header with Mobile Collapsible Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">Compose Email</h2>
                  <p className="text-[11px] text-zinc-400">Send single outreach or follow-up email</p>
                </div>
              </div>

              {/* Mobile Collapse Toggle Button */}
              <button
                type="button"
                onClick={() => setComposeCollapsed(!composeCollapsed)}
                className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
              >
                {composeCollapsed ? "Expand Form" : "Collapse"}
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${composeCollapsed ? "" : "rotate-180"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Collapsible Content */}
            {!composeCollapsed && (
              <div className="space-y-5">
                {/* Missing SendGrid config warning */}
                {missingConfig && (
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 p-4">
                    <div className="flex gap-3">
                      <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">SendGrid not configured</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Add your API key to <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono">.env</code> and restart:
                        </p>
                        <pre className="mt-1.5 text-[11px] font-mono bg-amber-100/70 dark:bg-amber-900/30 rounded-lg p-2 text-amber-900 dark:text-amber-200">{`SENDGRID_API_KEY=your_key`}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success banner */}
                {result?.success && (
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Email sent successfully!</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Delivered to <strong>{result.to}</strong> and logged in history.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error banner */}
                {result?.error && !missingConfig && (
                  <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{result.error}</p>
                  </div>
                )}

                {/* Compose Form */}
                <form onSubmit={handleSend} className="space-y-4">
                  {/* Sender & Template Selection Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Persona Selector */}
                    <div>
                      <label htmlFor="se-persona" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Sender Persona *
                      </label>
                      {personas.length > 0 ? (
                        <select
                          id="se-persona"
                          value={selectedPersonaId}
                          onChange={(e) => handlePersonaChange(e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          {personas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {p.position}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/30 px-3 py-2 text-xs text-zinc-400">
                          No personas.{" "}
                          <Link href="/admin/dashboard/personas" className="text-indigo-500 hover:underline">
                            Create one →
                          </Link>
                        </div>
                      )}
                      {activePersona && (
                        <p className="text-[10px] text-zinc-400 mt-1 truncate">
                          From: <span className="font-semibold text-zinc-600 dark:text-zinc-300 font-mono">{activePersona.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Template Selector */}
                    <div>
                      <label htmlFor="se-template" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Template (Optional)
                      </label>
                      <select
                        id="se-template"
                        value={selectedTemplateId}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="">— Manual Compose —</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.category}] {t.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-400 mt-1 italic">Pre-fills subject and body text.</p>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="se-to" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        To (Recipient Email) *
                      </label>
                      <input
                        id="se-to"
                        type="email"
                        required
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="prospect@company.com"
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="se-replyto" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Reply-To <span className="normal-case text-zinc-300 dark:text-zinc-600 font-normal">(optional)</span>
                      </label>
                      <input
                        id="se-replyto"
                        type="email"
                        value={replyTo}
                        onChange={(e) => setReplyTo(e.target.value)}
                        placeholder="replies@yourdomain.com"
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label htmlFor="se-subject" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Subject Line *
                    </label>
                    <input
                      id="se-subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Inquiry regarding partnership"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  {/* Message Body Header (With Write / Preview Tabs & Char Count) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setComposeTab("write")}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                            composeTab === "write"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:text-zinc-900"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposeTab("preview")}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                            composeTab === "preview"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:text-zinc-900"
                          }`}
                        >
                          Live Preview
                        </button>
                      </div>

                      <span className={`text-[10px] font-semibold ${charCount > 2000 ? "text-rose-500" : "text-zinc-400"}`}>
                        {charCount} chars
                      </span>
                    </div>

                    {composeTab === "write" ? (
                      <textarea
                        id="se-message"
                        required
                        rows={9}
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Write your email content here..."
                        className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-3 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="w-full min-h-[200px] rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 p-4 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {message ? (
                          message
                        ) : (
                          <span className="text-zinc-400 italic">No message content to preview. Type something in the Write tab.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary preview strip */}
                  {(activePersona || toEmail || subject) && (
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/40 dark:border-zinc-800/30 rounded-xl px-3.5 py-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                      {activePersona && (
                        <div className="truncate">
                          <span className="font-bold text-zinc-400 uppercase text-[9px]">From: </span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{activePersona.name}</span> &lt;{activePersona.email}&gt;
                        </div>
                      )}
                      {toEmail && (
                        <div className="truncate">
                          <span className="font-bold text-zinc-400 uppercase text-[9px]">To: </span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-mono">{toEmail}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setToEmail("");
                        setReplyTo(activePersona?.email || activePersona?.replyToEmail || "");
                        setSubject("");
                        setMessage("");
                        setCharCount(0);
                        setSelectedTemplateId("");
                      }}
                      className="rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-4 py-2.5 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !toEmail || !subject || !message || !activePersona}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {sending ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send & Save Email
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>


        {/* ── RIGHT COLUMN: Sent Emails Log & Thread Explorer Section ───────────── */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            activeMobileTab === "compose" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Section Header with Mobile Collapsible Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    Sent Email Log ({sentEmails.length})
                  </h2>
                  <p className="text-[11px] text-zinc-400">Track sent single emails and prospect reply threads</p>
                </div>
              </div>

              {/* Mobile Collapse Toggle Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setThreadsCollapsed(!threadsCollapsed)}
                  className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
                >
                  {threadsCollapsed ? "Expand Log" : "Collapse"}
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${threadsCollapsed ? "" : "rotate-180"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {!threadsCollapsed && (
              <div className="space-y-4">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <svg className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search recipient or subject..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 self-start sm:self-auto">
                    <button
                      onClick={() => setHistoryFilter("all")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        historyFilter === "all"
                          ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      All ({sentEmails.length})
                    </button>
                    <button
                      onClick={() => setHistoryFilter("replied")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        historyFilter === "replied"
                          ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      Replied ({repliedCount})
                    </button>
                  </div>
                </div>

                {/* Sync Notification Banner */}
                {syncMessage && (
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/30 p-2.5 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                    <span>{syncMessage}</span>
                    <button onClick={() => setSyncMessage(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                      ×
                    </button>
                  </div>
                )}

                {/* Thread List Container */}
                {loadingHistory ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  </div>
                ) : filteredSentEmails.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 p-8 text-center">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">No sent emails match your view.</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                      {searchQuery ? "Try clearing your search query." : "Send your first email using the form on the left!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                    {filteredSentEmails.map((item) => {
                      const messagesList = Array.isArray(item.messages)
                        ? item.messages
                        : typeof item.messages === "string"
                        ? JSON.parse(item.messages)
                        : [];

                      const isExpanded = selectedThread === item.id;
                      const isReplied = item.status === "Replied" || messagesList.some((m) => m.sender === "prospect");

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/40 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-2xs overflow-hidden"
                        >
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono truncate">
                                    {item.to_email}
                                  </span>
                                  {isReplied ? (
                                    <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300/40">
                                      ✓ REPLIED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-zinc-200/60 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                      Sent
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                  {item.subject}
                                </p>
                              </div>

                              <span className="text-[10px] text-zinc-400 whitespace-nowrap flex-shrink-0">
                                {item.created_at ? new Date(item.created_at).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }) : ""}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/30 dark:border-zinc-800/30">
                              <span className="truncate">
                                From: <span className="font-mono text-zinc-500 dark:text-zinc-400">{item.from_email}</span>
                              </span>
                              <button
                                onClick={() => setSelectedThread(isExpanded ? null : item.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex-shrink-0 ml-2"
                              >
                                {isExpanded ? "Hide Thread" : `View Thread (${messagesList.length})`}
                                <svg
                                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Thread Drawer */}
                          {isExpanded && (
                            <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                  Message History ({messagesList.length || 1})
                                </h4>
                              </div>

                              {messagesList.length === 0 ? (
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed border border-zinc-200/40 dark:border-zinc-800/40">
                                  {item.message}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {messagesList.map((m, idx) => (
                                    <div
                                      key={m.id || idx}
                                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                        m.sender === "prospect"
                                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40 ml-2"
                                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 mr-2"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 pb-1">
                                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                          {m.sender === "prospect"
                                            ? `📩 Reply from ${item.to_email}`
                                            : `📤 Outbound (${item.from_email})`}
                                        </span>
                                        <span>
                                          {m.date} {m.time}
                                        </span>
                                      </div>
                                      <p className="font-bold text-zinc-800 dark:text-zinc-200">{m.subject}</p>
                                      <div className="text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed text-[11px]">
                                        {m.body}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
