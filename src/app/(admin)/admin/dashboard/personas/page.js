"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const tones = ["Professional", "Friendly", "Urgent", "Casual", "Humorous"];
const genders = ["Male", "Female", "Non-binary", "Not Specified"];

const defaultFormState = {
  name: "",
  position: "",
  email: "",
  replyToEmail: "",
  tone: "Professional",
  imageUrl: "",
  gender: "Male",
  companyAddress: "",
  companyAddress2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "USA"
};

export default function PersonasManager() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);

  const [newPersona, setNewPersona] = useState(defaultFormState);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPersonas = () => {
    fetch("/api/personas")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch personas");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPersonas(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load personas:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPersona((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPersona((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!newPersona.name || !newPersona.email) {
      setError("Name and Email are required fields.");
      return;
    }

    setSaving(true);
    fetch("/api/personas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newPersona)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create persona");
        return res.json();
      })
      .then(() => {
        fetchPersonas();
        setNewPersona(defaultFormState);
        setShowAddForm(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to create persona.");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!editingPersona.name || !editingPersona.email) {
      setError("Name and Email are required fields.");
      return;
    }

    setSaving(true);
    fetch(`/api/personas/${encodeURIComponent(editingPersona.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(editingPersona)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update persona");
        return res.json();
      })
      .then(() => {
        fetchPersonas();
        setEditingPersona(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to update persona.");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete the persona "${name}"?`)) {
      fetch(`/api/personas/${encodeURIComponent(id)}`, {
        method: "DELETE"
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete persona");
          return res.json();
        })
        .then(() => {
          fetchPersonas();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete persona.");
        });
    }
  };

  const filtered = personas.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.position && p.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Persona Management
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Create and maintain sending personas with SendGrid Verified Sender identities & CAN-SPAM address compliance.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingPersona(null);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-md cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Create persona
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4.5 w-4.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search personas by name, title, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Personas Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-10 w-10 rounded-xl object-cover border border-zinc-200/30 dark:border-zinc-800/40"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm flex items-center justify-center border border-indigo-100/30">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {p.sendgridSenderId ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        p.sendgridVerified
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/40"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40"
                      }`}>
                        {p.sendgridVerified ? "✓ SG Sender Verified" : "⏳ SG Sender Pending"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-500 border border-zinc-200/20">
                        Local Persona
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{p.name}</h3>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{p.position || "Sender Persona"}</p>
                  <p className="text-xs text-zinc-400 font-mono break-all">{p.email}</p>
                  {p.replyToEmail && p.replyToEmail !== p.email && (
                    <p className="text-[10px] text-zinc-400 font-mono">Reply-To: {p.replyToEmail}</p>
                  )}
                  {p.companyAddress && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200/20 dark:border-zinc-800/30">
                      <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[8px] mb-0.5">CAN-SPAM Address</span>
                      {p.companyAddress}{p.city ? `, ${p.city}` : ""}{p.state ? `, ${p.state}` : ""} {p.zipCode} ({p.country || "USA"})
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/40 pt-3">
                <button
                  onClick={() => setEditingPersona(p)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/20 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl shadow-sm">
          <p className="text-zinc-400 text-sm italic">
            No personas found. Click &quot;Create persona&quot; above to add one.
          </p>
        </div>
      )}

      {/* Add Persona Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Create New SendGrid Persona</h3>
                <p className="text-[10px] text-zinc-400">Includes SendGrid Verified Sender identity creation & CAN-SPAM address fields</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-955/15 border border-rose-100/50 dark:border-rose-900/15 p-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={newPersona.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Position / Title
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={newPersona.position}
                    onChange={handleInputChange}
                    placeholder="e.g. Sales Director"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    From Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={newPersona.email}
                    onChange={handleInputChange}
                    placeholder="s.jenkins@company.com"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Reply-To Email <span className="normal-case text-zinc-400">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="replyToEmail"
                    value={newPersona.replyToEmail}
                    onChange={handleInputChange}
                    placeholder="replies@company.com"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={newPersona.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  >
                    {genders.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tone</label>
                  <select
                    name="tone"
                    value={newPersona.tone}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  >
                    {tones.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={newPersona.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* CAN-SPAM Address section */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/40 space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CAN-SPAM Physical Address (SendGrid Required)</h4>
                
                <div>
                  <input
                    type="text"
                    name="companyAddress"
                    value={newPersona.companyAddress}
                    onChange={handleInputChange}
                    placeholder="Street Address (e.g. 100 Main Street)"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="city"
                    value={newPersona.city}
                    onChange={handleInputChange}
                    placeholder="City (e.g. Austin)"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    name="state"
                    value={newPersona.state}
                    onChange={handleInputChange}
                    placeholder="State / Region (e.g. TX)"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="zipCode"
                    value={newPersona.zipCode}
                    onChange={handleInputChange}
                    placeholder="Zip Code (e.g. 78701)"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    name="country"
                    value={newPersona.country}
                    onChange={handleInputChange}
                    placeholder="Country (e.g. USA)"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/40 flex-shrink-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                  Create Persona & Register SendGrid Sender
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-5 py-2.5 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Persona Modal */}
      {editingPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Persona & SendGrid Sender Details</h3>
              <button
                onClick={() => setEditingPersona(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-955/15 border border-rose-100/50 dark:border-rose-900/15 p-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={editingPersona.name}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Position / Title
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={editingPersona.position || ""}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Sales Director"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    From Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={editingPersona.email}
                    onChange={handleEditInputChange}
                    placeholder="s.jenkins@company.com"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    name="replyToEmail"
                    value={editingPersona.replyToEmail || ""}
                    onChange={handleEditInputChange}
                    placeholder="replies@company.com"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={editingPersona.gender || "Male"}
                    onChange={handleEditInputChange}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  >
                    {genders.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tone</label>
                  <select
                    name="tone"
                    value={editingPersona.tone}
                    onChange={handleEditInputChange}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  >
                    {tones.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={editingPersona.imageUrl || ""}
                  onChange={handleEditInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Address Fields */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/40 space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CAN-SPAM Address (SendGrid Sync)</h4>

                <div>
                  <input
                    type="text"
                    name="companyAddress"
                    value={editingPersona.companyAddress || ""}
                    onChange={handleEditInputChange}
                    placeholder="Street Address"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="city"
                    value={editingPersona.city || ""}
                    onChange={handleEditInputChange}
                    placeholder="City"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    name="state"
                    value={editingPersona.state || ""}
                    onChange={handleEditInputChange}
                    placeholder="State / Region"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="zipCode"
                    value={editingPersona.zipCode || ""}
                    onChange={handleEditInputChange}
                    placeholder="Zip Code"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    name="country"
                    value={editingPersona.country || "USA"}
                    onChange={handleEditInputChange}
                    placeholder="Country"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/40 flex-shrink-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                  Save Changes & Sync SendGrid
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPersona(null)}
                  className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-5 py-2.5 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
