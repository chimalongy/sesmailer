"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const categories = ["AI & Tech", "Fintech", "SaaS", "Payments", "Healthcare", "Tech", "CleanTech", "Geo domain"];
const badges = ["None", "Hot", "Premium", "Popular", "New", "High Value", "Exclusive", "Brandable", "Eco-Tech"];
const domainTypes = ["Brandable Domain", "ExactMatch Domain (EMD)", "Geo Domain"];

export default function PortfolioCRUD() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newDomain, setNewDomain] = useState({
    name: "",
    category: "AI & Tech",
    type: "Brandable Domain",
    city: "",
    niche: "",
    description: "",
    tags: "",
    badge: "None",
    price: "Inquire",
    purchase_price: ""
  });
  const [error, setError] = useState("");

  const fetchDomains = () => {
    setLoading(true);
    fetch("/api/domains")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch domains");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDomains(data);
        }
      })
      .catch((err) => {
        console.error("Error loading domains from database:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDomain((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleAddDomainSubmit = (e) => {
    e.preventDefault();
    setError("");

    const nameTrimmed = newDomain.name.trim().toLowerCase();
    if (!nameTrimmed) {
      setError("Domain name is required.");
      return;
    }

    const exists = domains.some((d) => d.name.toLowerCase() === nameTrimmed);
    if (exists) {
      setError(`Domain "${newDomain.name}" is already in your portfolio.`);
      return;
    }

    const tagsArray = newDomain.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      name: nameTrimmed,
      category: newDomain.category,
      description: newDomain.description.trim() || "Premium domain name available for acquisition.",
      tags: tagsArray.length > 0 ? tagsArray : ["Premium"],
      badge: newDomain.badge === "None" ? "" : newDomain.badge,
      price: newDomain.price.trim() || "Inquire",
      purchase_price: newDomain.purchase_price.trim() || null,
      type: newDomain.type || "Brandable Domain",
      city: newDomain.type === "Geo Domain" ? newDomain.city.trim() : null,
      niche: newDomain.type === "Geo Domain" ? newDomain.niche.trim() : null
    };

    fetch("/api/domains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add domain");
        return res.json();
      })
      .then(() => {
        fetchDomains();
        setNewDomain({
          name: "",
          category: "AI & Tech",
          type: "Brandable Domain",
          city: "",
          niche: "",
          description: "",
          tags: "",
          badge: "None",
          price: "Inquire",
          purchase_price: ""
        });
        setShowAddForm(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to add domain to database.");
      });
  };

  // Start Edit
  const handleStartEdit = (domain) => {
    setEditingDomain({
      ...domain,
      badge: domain.badge || "None",
      tags: Array.isArray(domain.tags) ? domain.tags.join(", ") : "",
      purchase_price: domain.purchase_price || "",
      type: domain.type || "Brandable Domain",
      city: domain.city || "",
      niche: domain.niche || ""
    });
    setShowAddForm(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingDomain((prev) => ({ ...prev, [name]: value }));
  };

  // Save Edit
  const handleEditDomainSubmit = (e) => {
    e.preventDefault();
    if (!editingDomain) return;
    
    const tagsArray = (editingDomain.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      category: editingDomain.category,
      description: editingDomain.description.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ["Premium"],
      badge: editingDomain.badge === "None" ? "" : editingDomain.badge,
      price: editingDomain.price.trim() || "Inquire",
      purchase_price: editingDomain.purchase_price.trim() || null,
      type: editingDomain.type || "Brandable Domain",
      city: editingDomain.type === "Geo Domain" ? editingDomain.city.trim() : null,
      niche: editingDomain.type === "Geo Domain" ? editingDomain.niche.trim() : null
    };

    fetch(`/api/domains/${encodeURIComponent(editingDomain.name)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update domain");
        return res.json();
      })
      .then(() => {
        fetchDomains();
        setEditingDomain(null);
      })
      .catch((err) => {
        alert(err.message || "Failed to update domain details.");
      });
  };

  const handleDeleteDomain = (name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the public catalog?`)) {
      fetch(`/api/domains/${encodeURIComponent(name)}`, {
        method: "DELETE"
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete domain");
          return res.json();
        })
        .then(() => {
          fetchDomains();
        })
        .catch((err) => {
          alert(err.message || "Failed to remove domain.");
        });
    }
  };

  const filtered = domains.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-905 dark:text-white">
            Portfolio Manager
          </h1>
          <p className="mt-1.5 text-sm text-zinc-550 dark:text-zinc-405">
            Add, update, or remove domains from your public investor portfolio.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingDomain(null);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-md cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add domain
        </button>
      </div>

      {/* Add Domain Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Register New Domain Asset</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-zinc-455 hover:text-zinc-655 dark:hover:text-zinc-205 cursor-pointer text-xl font-bold font-sans"
              >
                &times;
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <div className="p-6 overflow-y-auto flex-grow">
              <form onSubmit={handleAddDomainSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-955/15 border border-rose-100/50 dark:border-rose-900/15 p-4 text-xs font-semibold text-rose-600 dark:text-rose-455">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Domain Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={newDomain.name}
                      onChange={handleInputChange}
                      placeholder="e.g. alphaflow.ai"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Domain Type *
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      value={newDomain.type}
                      onChange={handleInputChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer text-zinc-800 dark:text-zinc-205"
                    >
                      {domainTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Category Vertical
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={newDomain.category}
                      onChange={handleInputChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {newDomain.type === "Geo Domain" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 animate-scale-up">
                    <div>
                      <label htmlFor="city" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                        Target City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        value={newDomain.city || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. Austin"
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="niche" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                        Target Niche *
                      </label>
                      <input
                        type="text"
                        id="niche"
                        name="niche"
                        required
                        value={newDomain.niche || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. plumbers"
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="price" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Price Status / Amount
                    </label>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={newDomain.price}
                      onChange={handleInputChange}
                      placeholder="e.g. Inquire or 12,000"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase_price" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Purchase Price ($)
                    </label>
                    <input
                      type="text"
                      id="purchase_price"
                      name="purchase_price"
                      value={newDomain.purchase_price}
                      onChange={handleInputChange}
                      placeholder="e.g. 4,500"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="badge" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Showcase Badge
                    </label>
                    <select
                      id="badge"
                      name="badge"
                      value={newDomain.badge}
                      onChange={handleInputChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    >
                      {badges.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Sub-tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={newDomain.tags}
                    onChange={handleInputChange}
                    placeholder="e.g. Artificial Intelligence, NLP, Automation"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={newDomain.description}
                    onChange={handleInputChange}
                    placeholder="Highly brandable one-word asset suited for..."
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505 resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/30">
                  <button
                    type="submit"
                    className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-sm py-3 shadow-md active:scale-98 transition-all cursor-pointer text-center"
                  >
                    Add Domain
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-6 py-3 font-semibold text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Edit Domain Form */}
      {editingDomain && (
        <div className="bg-white dark:bg-zinc-900 border border-amber-200/40 dark:border-amber-900/25 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-905 dark:text-white mb-6">
            Edit Asset Details: <span className="text-amber-650 dark:text-amber-400 font-extrabold">{editingDomain?.name}</span>
          </h3>
          
          <form onSubmit={handleEditDomainSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Domain Name (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingDomain.name}
                  className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-955/40 px-4 py-2.5 text-sm text-zinc-550 border border-zinc-200/30 dark:border-zinc-800/15 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="edit-type" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Domain Type *
                </label>
                <select
                  id="edit-type"
                  name="type"
                  required
                  value={editingDomain.type || "Brandable Domain"}
                  onChange={handleEditInputChange}
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer text-zinc-800 dark:text-zinc-205"
                >
                  {domainTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-category" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Category Vertical
                </label>
                <select
                  id="edit-category"
                  name="category"
                  value={editingDomain.category}
                  onChange={handleEditInputChange}
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {editingDomain.type === "Geo Domain" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 animate-scale-up">
                <div>
                  <label htmlFor="edit-city" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Target City *
                  </label>
                  <input
                    type="text"
                    id="edit-city"
                    name="city"
                    required
                    value={editingDomain.city || ""}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Austin"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-niche" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Target Niche *
                  </label>
                  <input
                    type="text"
                    id="edit-niche"
                    name="niche"
                    required
                    value={editingDomain.niche || ""}
                    onChange={handleEditInputChange}
                    placeholder="e.g. plumbers"
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="edit-price" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Price Status / Amount
                </label>
                <input
                  type="text"
                  id="edit-price"
                  name="price"
                  value={editingDomain.price}
                  onChange={handleEditInputChange}
                  placeholder="e.g. Inquire or 12,000"
                  className="w-full rounded-xl bg-zinc-55 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="edit-purchase_price" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Purchase Price ($)
                </label>
                <input
                  type="text"
                  id="edit-purchase_price"
                  name="purchase_price"
                  value={editingDomain.purchase_price}
                  onChange={handleEditInputChange}
                  placeholder="e.g. 4,500"
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="edit-badge" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Showcase Badge
                </label>
                <select
                  id="edit-badge"
                  name="badge"
                  value={editingDomain.badge}
                  onChange={handleEditInputChange}
                  className="w-full rounded-xl bg-zinc-55 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                >
                  {badges.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="edit-tags" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Sub-tags (Comma separated)
              </label>
              <input
                type="text"
                id="edit-tags"
                name="tags"
                value={editingDomain.tags}
                onChange={handleEditInputChange}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                rows="3"
                value={editingDomain.description}
                onChange={handleEditInputChange}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 resize-none"
              ></textarea>
            </div>

            <div className="flex gap-4 pt-3">
              <button
                type="submit"
                className="flex-grow rounded-xl bg-amber-500 hover:bg-amber-605 text-white font-semibold text-sm py-3 shadow-md active:scale-98 transition-all cursor-pointer text-center"
              >
                Save Asset Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingDomain(null)}
                className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-6 py-3 font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Domain Database List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/25 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="px-6 py-5 border-b border-zinc-100/60 dark:border-zinc-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Investor Catalog ({filtered.length})</h3>
          
          <div className="w-full sm:max-w-xs flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/25 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <svg className="h-4 w-4 text-zinc-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search catalog domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-xs text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold">Loading catalog domains...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100/55 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <th className="py-3 px-6">Domain</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Vertical</th>
                  <th className="py-3 px-6">Tags</th>
                  <th className="py-3 px-6">Badge</th>
                  <th className="py-3 px-6 text-right">Purchase Price</th>
                  <th className="py-3 px-6 text-right">Price</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/60 dark:divide-zinc-850/35 text-sm">
                {filtered.map((d) => (
                  <tr key={d.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-zinc-900 dark:text-white font-mono">
                      {d.name}
                    </td>
                    <td className="py-4 px-6 text-zinc-650 dark:text-zinc-400">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                        d.type === "Geo Domain"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                          : d.type === "ExactMatch Domain (EMD)"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400"
                      }`}>
                        {d.type || "Brandable Domain"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-semibold text-indigo-650 dark:text-indigo-400">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {d.tags && Array.isArray(d.tags) && d.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {d.badge ? (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded">
                          {d.badge}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-650">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-mono text-zinc-550 dark:text-zinc-400">
                      {d.purchase_price ? `$${d.purchase_price}` : "-"}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-zinc-900 dark:text-white">
                      {d.price}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <Link
                        href={`/admin/dashboard/outbounds/create?domain=${d.name}`}
                        className="inline-flex justify-center rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 px-2.5 py-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                      >
                        Outbound
                      </Link>
                      <button
                        onClick={() => handleStartEdit(d)}
                        className="inline-flex justify-center rounded bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 px-2.5 py-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(d.name)}
                        className="inline-flex justify-center rounded bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
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
          <div className="text-center py-16 text-zinc-450 dark:text-zinc-500">
            No domains match your search query.
          </div>
        )}
      </div>
    </div>
  );
}
