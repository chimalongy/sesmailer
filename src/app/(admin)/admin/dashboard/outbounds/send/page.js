"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SendSingleEmail() {
  // ── Sender ──────────────────────────────────────────────────────────────────
  const [personas, setPersonas]           = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");

  // ── Templates ───────────────────────────────────────────────────────────────
  const [templates, setTemplates]         = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [toEmail, setToEmail]             = useState("");
  const [replyTo, setReplyTo]             = useState("");
  const [subject, setSubject]             = useState("");
  const [message, setMessage]             = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [sending, setSending]             = useState(false);
  const [result, setResult]               = useState(null); // { success, error, messageId }
  const [missingConfig, setMissingConfig] = useState(false);
  const [charCount, setCharCount]         = useState(0);

  // ── Load personas & templates ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPersonas(data);
          if (data.length > 0) setSelectedPersonaId(data[0].id);
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
          replyTo:   replyTo.trim() || undefined
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
        setReplyTo("");
        setSubject("");
        setMessage("");
        setCharCount(0);
        setSelectedTemplateId("");
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  // ── Character count ───────────────────────────────────────────────────────────
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard/outbounds"
          className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 flex items-center gap-1.5 group"
        >
          <svg className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Outbound Mail Desk
        </Link>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 px-3 py-1 rounded-full">
          Single Send
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Compose Single Email
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Send a one-off email directly via AWS SES using any of your sender personas.
        </p>
      </div>

      {/* Missing SES config warning */}
      {missingConfig && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">AWS SES not configured</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">
                Add these keys to your <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded font-mono">.env.local</code> file and restart the server:
              </p>
              <pre className="mt-2 text-xs font-mono bg-amber-100 dark:bg-amber-900/20 rounded-lg p-3 text-amber-800 dark:text-amber-300 leading-relaxed">{`AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Success banner */}
      {result?.success && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/25 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Email sent successfully!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Delivered to <strong>{result.to}</strong>
              {result.messageId && <span className="ml-2 font-mono opacity-60">(ID: {result.messageId.slice(0, 20)}…)</span>}
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {result?.error && !missingConfig && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/15 border border-rose-100/50 dark:border-rose-900/20 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{result.error}</p>
        </div>
      )}

      {/* Compose Form */}
      <form onSubmit={handleSend} className="space-y-6">

        {/* Sender & Template row */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Sender & Template</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Persona picker */}
            <div>
              <label htmlFor="se-persona" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Sender Persona *
              </label>
              {personas.length > 0 ? (
                <select
                  id="se-persona"
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.position}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/30 dark:border-zinc-800/20 px-3.5 py-2.5 text-xs text-zinc-400">
                  No personas found.{" "}
                  <Link href="/admin/dashboard/personas" className="text-indigo-500 hover:underline">
                    Create one →
                  </Link>
                </div>
              )}
              {activePersona && (
                <p className="text-[10px] text-zinc-400 mt-1.5">
                  Sending from: <span className="font-semibold text-zinc-600 dark:text-zinc-400 font-mono">{activePersona.email}</span>
                </p>
              )}
            </div>

            {/* Template picker */}
            <div>
              <label htmlFor="se-template" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Load from Template
              </label>
              <select
                id="se-template"
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Manual compose —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-400 mt-1.5 italic">Selecting a template pre-fills subject and message.</p>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Recipients</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="se-to" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                To (Email Address) *
              </label>
              <input
                id="se-to"
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="prospect@company.com"
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="se-replyto" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Reply-To <span className="normal-case text-zinc-300 font-normal">(optional)</span>
              </label>
              <input
                id="se-replyto"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="replies@yourdomain.com"
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Message</h2>

          <div>
            <label htmlFor="se-subject" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Subject Line *
            </label>
            <input
              id="se-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick question about yourdomain.com"
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="se-message" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Email Body *
              </label>
              <span className={`text-[10px] font-semibold ${charCount > 2000 ? "text-rose-500" : "text-zinc-400"}`}>
                {charCount} chars
              </span>
            </div>
            <textarea
              id="se-message"
              required
              rows="14"
              value={message}
              onChange={handleMessageChange}
              placeholder="Write your email here..."
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
            />
            <p className="text-[10px] text-zinc-400 mt-1.5 italic">
              Plain text. Line breaks are preserved when delivered.
            </p>
          </div>
        </div>

        {/* Preview strip */}
        {(activePersona || toEmail) && (
          <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/30 dark:border-zinc-800/20 rounded-xl px-5 py-4 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-6 gap-y-1.5">
            {activePersona && (
              <span>
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">From </span>
                {activePersona.name} &lt;{activePersona.email}&gt;
              </span>
            )}
            {toEmail && (
              <span>
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">To </span>
                {toEmail}
              </span>
            )}
            {subject && (
              <span>
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Subject </span>
                {subject}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/dashboard/outbounds"
            className="rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm px-5 py-3"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={sending || !toEmail || !subject || !message || !activePersona}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
