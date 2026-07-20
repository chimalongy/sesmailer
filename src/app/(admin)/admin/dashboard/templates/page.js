"use client";

import { useState, useEffect } from "react";

const categories = [
  { id: "FirstOutbound", label: "FirstOutbound Templates" },
  { id: "FollowUp", label: "Follow Up Templates" },
  { id: "PriceChange", label: "Price Change Templates" }
];

export default function TemplatesCRUD() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formState, setFormState] = useState({
    name: "",
    category: "FirstOutbound",
    subject: "",
    message: ""
  });

  const fetchTemplates = () => {
    setLoading(true);
    fetch("/api/templates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load templates");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTemplates(data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormState({
      name: "",
      category: "FirstOutbound",
      subject: "",
      message: ""
    });
    setError("");
    setSuccess("");
    setShowFormModal(true);
  };

  const openEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setFormState({
      name: tpl.name,
      category: tpl.category,
      subject: tpl.subject,
      message: tpl.message
    });
    setError("");
    setSuccess("");
    setShowFormModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formState.name.trim() || !formState.subject.trim() || !formState.message.trim() || !formState.category) {
      setError("Please fill out all required fields.");
      return;
    }

    const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates";
    const method = editingTemplate ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formState)
    })
      .then((res) => {
        if (!res.ok) throw new Error(editingTemplate ? "Failed to update template" : "Failed to create template");
        return res.json();
      })
      .then(() => {
        setSuccess(editingTemplate ? "Template updated successfully!" : "Template created successfully!");
        fetchTemplates();
        setTimeout(() => {
          setShowFormModal(false);
        }, 1200);
      })
      .catch((err) => {
        setError(err.message || "An unexpected error occurred.");
      });
  };

  const handleDeleteTemplate = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the template "${name}"?`)) {
      fetch(`/api/templates/${id}`, {
        method: "DELETE"
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete template");
          return res.json();
        })
        .then(() => {
          fetchTemplates();
        })
        .catch((err) => {
          alert(err.message || "Could not delete template.");
        });
    }
  };

  const filtered = templates.filter((t) => {
    const matchesCategory = filterTab === "All" || t.category === filterTab;
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Email Templates Library
          </h1>
          <p className="mt-1.5 text-sm text-zinc-550 dark:text-zinc-400 font-medium">
            Design and organize outreach pitch emails, standard follow-ups, and price change proposals.
          </p>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
          >
            Create New Template
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[{ id: "All", label: "All Categories" }, ...categories].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterTab(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterTab === cat.id
                  ? "bg-indigo-650 border-indigo-650 text-white"
                  : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200/40 dark:border-zinc-800/30 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full md:max-w-xs flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/25 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <svg className="h-4 w-4 text-zinc-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search templates text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/20 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Loading template database...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {tpl.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      tpl.category === "FirstOutbound"
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                        : tpl.category === "FollowUp"
                        ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {tpl.category === "FirstOutbound"
                      ? "FirstOutbound"
                      : tpl.category === "FollowUp"
                      ? "Follow Up"
                      : "Price Change"}
                  </span>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800/40 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 overflow-hidden text-xs">
                  <div className="px-3.5 py-2.5 bg-zinc-100/55 dark:bg-zinc-950/60 font-mono text-[10px] text-zinc-600 dark:text-zinc-450 border-b border-zinc-100 dark:border-zinc-800/30 truncate">
                    Subject: {tpl.subject}
                  </div>
                  <div className="p-3.5 font-mono text-[10px] text-zinc-550 dark:text-zinc-400 whitespace-pre-wrap max-h-[160px] overflow-y-auto leading-relaxed">
                    {tpl.message.replaceAll("\\n", "\n")}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-850/40 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(tpl)}
                    className="inline-flex justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 px-3 py-1.5 text-xs font-semibold cursor-pointer border border-zinc-200/50 dark:border-zinc-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                    className="inline-flex justify-center rounded-lg bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 px-3 py-1.5 text-xs font-semibold cursor-pointer border border-rose-200/20 dark:border-rose-900/10"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-[9px] text-zinc-400 italic">
                  ID: {tpl.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/25 rounded-2xl text-zinc-450 dark:text-zinc-500">
          No templates match your search criteria. Create one above to get started.
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {editingTemplate ? "Edit Template Details" : "Create New Template"}
                </h3>
                <p className="text-[10px] text-zinc-455 dark:text-zinc-500 mt-0.5">
                  Configure dynamic values and categories for automated sequence pitches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl font-bold font-sans"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-955/15 border border-rose-100/50 dark:border-rose-900/15 p-4 text-xs font-semibold text-rose-600 dark:text-rose-455">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/15 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Value Pitch (Friendly)"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Outreach Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505 cursor-pointer text-zinc-800 dark:text-zinc-250"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formState.subject}
                  onChange={handleInputChange}
                  placeholder="e.g. Acquiring the premium brand identity [domain]"
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Email Message Body *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="8"
                  value={formState.message}
                  onChange={handleInputChange}
                  placeholder="Enter email pitch content here..."
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505 font-mono resize-none leading-relaxed"
                ></textarea>
              </div>

              {/* Variable Guideline Card */}
              <div className="bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/10 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-indigo-650 dark:text-indigo-400 block mb-1">
                  Dynamic Variable Placeholders:
                </span>
                <p className="text-zinc-550 dark:text-zinc-450 leading-relaxed text-[11px]">
                  Use the following tags in the subject or message body to inject campaign attributes on execution:
                </p>
                <ul className="list-disc pl-5 text-[10px] text-zinc-550 dark:text-zinc-400 space-y-1">
                  <li>
                    <strong className="font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-955/20 px-1 rounded">[domain]</strong> &mdash; Replaced by the cold campaign domain name (e.g. quantumflow.ai).
                  </li>
                  <li>
                    <strong className="font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-955/20 px-1 rounded">[personaName]</strong> &mdash; Replaced by the selected sender persona full name (e.g. Michael Riley).
                  </li>
                  <li>
                    <strong className="font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-955/20 px-1 rounded">[City]</strong> &mdash; Replaced by target city (e.g. Austin) for Geo Domains.
                  </li>
                  <li>
                    <strong className="font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-955/20 px-1 rounded">[niche]</strong> &mdash; Replaced by target business niche vertical (e.g. plumbers) for Geo Domains.
                  </li>
                  {formState.category === "PriceChange" && (
                    <li>
                      <strong className="font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-955/20 px-1 rounded">[price]</strong> &mdash; Replaced by the custom new price parameter (e.g. $14,000) during task scheduling. Required for Price Change Templates.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200/30 dark:border-zinc-800/25 flex justify-end gap-3 flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-950/20">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-xs px-5 py-2.5 cursor-pointer active:scale-95 transition-all"
              >
                {editingTemplate ? "Save Changes" : "Create Template"}
              </button>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 px-5 py-2.5 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
