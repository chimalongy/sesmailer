"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Extended portfolio of domains
const domainsData = [
  {
    name: "quantumflow.ai",
    category: "AI & Tech",
    description: "Ultra-brandable domain name perfect for machine learning, AI agents, or computational workflows.",
    tags: ["Artificial Intelligence", "Machine Learning", "Workflow"],
    badge: "Hot",
    price: "Inquire"
  },
  {
    name: "finverge.io",
    category: "Fintech",
    description: "Highly memorable finance domain representing convergence, growth, and leading-edge payment tech.",
    tags: ["Payments", "Neo-Bank", "DeFi"],
    badge: "Premium",
    price: "Inquire"
  },
  {
    name: "cloudly.co",
    category: "SaaS",
    description: "A rare, friendly brandable domain name for cloud computing, file sharing, or developer tools.",
    tags: ["Cloud", "Storage", "DevOps"],
    badge: "Popular",
    price: "Inquire"
  },
  {
    name: "payflow.app",
    category: "Payments",
    description: "Direct-action product name for transaction APIs, mobile banking wallets, or subscription SaaS.",
    tags: ["Transactions", "API", "Mobile App"],
    badge: "Premium",
    price: "Inquire"
  },
  {
    name: "healthspire.com",
    category: "Healthcare",
    description: "Inspiring digital health domain for biotech startups, fitness ecosystems, or telehealth platforms.",
    tags: ["Telehealth", "Biotech", "Fitness"],
    badge: "Est. Value",
    price: "Inquire"
  },
  {
    name: "solaria.net",
    category: "CleanTech",
    description: "Energetic and bright domain name suited for solar energy innovators or global grid networks.",
    tags: ["Solar", "Clean Energy", "Infrastructure"],
    badge: "Eco-Tech",
    price: "Inquire"
  },
  {
    name: "neuralcore.ai",
    category: "AI & Tech",
    description: "Core branding for neural networks, deep learning APIs, and artificial intelligence infrastructure.",
    tags: ["Deep Learning", "API", "Hardware"],
    badge: "Exclusive",
    price: "Inquire"
  },
  {
    name: "payprism.com",
    category: "Payments",
    description: "Multidimensional payment gateway name suited for cross-border transactions and digital invoicing.",
    tags: ["Gateway", "Invoicing", "B2B"],
    badge: "Brandable",
    price: "Inquire"
  },
  {
    name: "optiloop.io",
    category: "SaaS",
    description: "Continuous optimization feedback loop, ideal for product analytics, A/B testing platforms, or CRM toolings.",
    tags: ["Analytics", "Marketing", "SaaS"],
    badge: "New",
    price: "Inquire"
  },
  {
    name: "biovance.com",
    category: "Healthcare",
    description: "Forward-looking biological science domain, excellent for life sciences, pharma, or genetic research companies.",
    tags: ["Pharma", "Genetics", "Life Sciences"],
    badge: "High Value",
    price: "Inquire"
  },
  {
    name: "ledgerlabs.org",
    category: "Tech",
    description: "Research-centric domain name for blockchain audits, consensus mechanisms, or security analytics.",
    tags: ["Blockchain", "Security", "Web3"],
    badge: "Niche",
    price: "Inquire"
  },
  {
    name: "datavoxel.com",
    category: "Tech",
    description: "Spatial data, 3D visualization, or graphics computing engine domain name with strong technical authority.",
    tags: ["3D Data", "Graphics", "Big Data"],
    badge: "Premium",
    price: "Inquire"
  }
];

// Available categories derived from data
const categories = ["All", "AI & Tech", "Fintech", "SaaS", "Payments", "Healthcare", "Tech", "Geo domain"];

function PortfolioContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);

  // Load from localStorage initially
  useEffect(() => {
    fetch("/api/domains")
      .then((res) => {
        if (!res.ok) throw new Error("Database fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDomains(data);
        } else {
          setDomains(domainsData);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch domains from database:", err);
        setDomains(domainsData);
      });
  }, []);

  // Sync search term from URL query parameters (e.g. ?search=ai)
  useEffect(() => {
    const searchUrl = searchParams.get("search");
    if (searchUrl) {
      setSearchTerm(searchUrl);
    }
  }, [searchParams]);

  // Apply filters
  useEffect(() => {
    let result = domains;

    // Search query filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (domain) =>
          domain.name.toLowerCase().includes(term) ||
          domain.description.toLowerCase().includes(term) ||
          domain.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter((domain) => domain.category === activeCategory);
    }

    setFilteredDomains(result);
  }, [searchTerm, activeCategory, domains]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
      {/* Page Header */}
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-905 dark:text-white">
          Premium Domain Portfolio
        </h1>
        <p className="mt-3 text-lg text-zinc-650 dark:text-zinc-400">
          Handpicked premium digital real estate. Use filters to explore domains matching your market vertical.
        </p>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-8 mb-10">
        {/* Search */}
        <div className="w-full max-w-sm flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/80 transition-all">
          <svg
            className="h-5 w-5 text-zinc-400 ml-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by keyword (e.g. ai, app)..."
            className="w-full bg-transparent border-0 outline-none text-sm text-zinc-800 dark:text-zinc-200 py-2 px-3"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-zinc-400 hover:text-zinc-600 mr-2 p-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
                activeCategory === cat
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredDomains.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDomains.map((domain) => (
            <div
              key={domain.name}
              className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-sm hover:shadow-lg dark:hover:border-zinc-700/80 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200/10 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {domain.category}
                  </span>
                  {domain.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {domain.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {domain.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {domain.description}
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {domain.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-650 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Price Status
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {domain.price}
                  </span>
                </div>
                <Link
                  href={`/Contact?domain=${domain.name}`}
                  className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                >
                  Make Offer
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">No domains found</h3>
          <p className="mt-2 text-sm text-zinc-500">
            No domains matched "{searchTerm}" under category "{activeCategory}".
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("All");
              }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Escrow note */}
      <div className="mt-16 bg-indigo-50/50 dark:bg-zinc-950 border border-indigo-100/50 dark:border-zinc-800/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-905 dark:text-white flex items-center gap-2">
            <svg
              className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Don't see your target domain?
          </h3>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 max-w-2xl leading-relaxed">
            We offer stealth acquisition and brokerage services. If you need assistance securing a domain owned by a third-party, our experienced brokers can negotiate on your behalf.
          </p>
        </div>
        <Link
          href="/Contact?subject=Stealth Acquisition Service Inquiry"
          className="w-full md:w-auto inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer text-center"
        >
          Consult a Broker
        </Link>
      </div>
    </div>
  );
}

export default function Portfolio() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <PortfolioContent />
    </Suspense>
  );
}
