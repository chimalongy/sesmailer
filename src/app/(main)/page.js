"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Placeholder featured domains
const featuredDomains = [
  {
    name: "quantumflow.ai",
    category: "AI & Tech",
    description: "Ultra-brandable domain name perfect for machine learning, AI agents, or computational workflows.",
    badge: "Hot",
    price: "Inquire"
  },
  {
    name: "finverge.io",
    category: "Fintech",
    description: "Highly memorable finance domain representing convergence, growth, and leading-edge payment tech.",
    badge: "Premium",
    price: "Inquire"
  },
  {
    name: "cloudly.co",
    category: "SaaS",
    description: "A rare, friendly brandable domain name for cloud computing, file sharing, or developer tools.",
    badge: "Popular",
    price: "Inquire"
  },
  {
    name: "payflow.app",
    category: "Payments",
    description: "Direct-action product name for transaction APIs, mobile banking wallets, or subscription SaaS.",
    badge: "Premium",
    price: "Inquire"
  },
  {
    name: "healthspire.com",
    category: "Healthcare",
    description: "Inspiring digital health domain for biotech startups, fitness ecosystems, or telehealth platforms.",
    badge: "Est. Value",
    price: "Inquire"
  },
  {
    name: "solaria.net",
    category: "CleanTech",
    description: "Energetic and bright domain name suited for solar energy innovators or global grid networks.",
    badge: "Eco-Tech",
    price: "Inquire"
  }
];

// FAQs
const faqs = [
  {
    question: "Why should I purchase a premium domain name?",
    answer: "A premium domain name gives your business immediate authority, higher brand recall, trust, and natural SEO advantages. It prevents competitors from capturing your traffic and represents a valuable, appreciating digital asset."
  },
  {
    question: "How does the domain transfer process work?",
    answer: "We utilize highly secure third-party escrow services (Escrow.com, DAN, or SEDO) to facilitate safe transactions. Once payment is secured, the domain is transferred directly to your registrar (GoDaddy, Namecheap, etc.) usually within 24 to 48 hours."
  },
  {
    question: "Can I lease a domain or pay in installments?",
    answer: "Yes, we are open to flexible payment plans and lease-to-own models through secure platforms like DAN.com. Contact us to discuss options suited to your budget."
  },
  {
    question: "Can I submit a custom offer on any domain?",
    answer: "Absolutely. All handpicked domains in our portfolio are open to serious offers. Simply click the 'Make Offer' button or fill out our Contact form with your proposed amount."
  }
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);
  const [featuredList, setFeaturedList] = useState([]);

  useEffect(() => {
    fetch("/api/domains")
      .then((res) => {
        if (!res.ok) throw new Error("Database fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFeaturedList(data.slice(0, 6));
        } else {
          setFeaturedList(featuredDomains);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch domains from database:", err);
        setFeaturedList(featuredDomains);
      });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/Portfolio?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/Portfolio");
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 py-20 lg:py-32 px-6 sm:px-8">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="mx-auto max-w-4xl text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-200/20">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            Acquire Elite Digital Assets
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] max-w-3xl">
            Establish Authority With a{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Genius Domain Name
            </span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Handpicked, premium web addresses tailored to elevate your startup, SaaS, AI tool, or enterprise. Memorable. Brandable. Secure.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-10 w-full max-w-xl flex items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/40 border border-zinc-200 dark:border-zinc-800 p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/80 transition-all">
            <div className="flex-1 flex items-center px-3">
              <svg
                className="h-5 w-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search our premium domains (e.g., ai, flow, pay)..."
                className="w-full bg-transparent border-0 outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-2.5 px-2 focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer active:scale-95"
            >
              Search
            </button>
          </form>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/Portfolio"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 transition-colors active:scale-95"
            >
              Browse Full Portfolio
            </Link>
            <Link
              href="/Contact"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition-colors active:scale-95"
            >
              Contact Broker
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Domains Section */}
      <section className="w-full max-w-7xl px-6 py-20 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Featured Premium Listings
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-lg">
              Explore a few of our handpicked, highly coveted domains ready for instant transfer.
            </p>
          </div>
          <Link
            href="/Portfolio"
            className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 group"
          >
            See all domains
            <svg
              className="h-4 w-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredList.map((domain) => (
            <div
              key={domain.name}
              className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 shadow-sm hover:shadow-lg dark:hover:border-zinc-700/80 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/10 px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
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
                  className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Make Offer
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-20 px-6 sm:px-8 border-y border-zinc-200/50 dark:border-zinc-800/50 transition-colors">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl lg:text-center mx-auto mb-16">
            <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
              Increase Brand Equity
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Why Invest In A Premium Domain?
            </p>
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
              Your domain name is the digital front door of your enterprise. It affects how customers perceive your size, safety, and leadership status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-zinc-905 dark:text-white">
                Instant Trust & Authority
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                A premium, logical domain boosts client trust and vendor credibility on first contact.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-zinc-905 dark:text-white">
                Compounding SEO Value
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Exact-match search relevance and strong backlink velocity make ranking in search engine algorithms much easier.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-zinc-905 dark:text-white">
                Higher Brand Recall
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Short, memorable domains reduce word-of-mouth friction and yield much higher conversion rates on marketing campaigns.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-zinc-905 dark:text-white">
                Appreciating Digital Asset
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Domain inventory is strictly finite. Elite domains appreciate over time and can be resold or leased, preserving capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Guide / Steps Section */}
      <section className="w-full max-w-7xl px-6 py-20 sm:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            100% Safe & Secure Transfer Process
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Acquiring premium assets can feel complex. We handle everything transparently in 3 easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="flex flex-col items-center text-center p-6 relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg mb-4 shadow-md shadow-indigo-500/20">
              1
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Agree on Offer</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
              Make an offer on your selected domain. We align on a price and set up a private agreement link.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg mb-4 shadow-md shadow-indigo-500/20">
              2
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Secure Escrow Payment</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
              Payment is held securely in escrow (Escrow.com or Dan.com) until the domain is fully handed over to you.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg mb-4 shadow-md shadow-indigo-500/20">
              3
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Instant DNS Ownership</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
              We send the auth transfer code or push the domain directly to your registrar accounts. Transfer complete in hours!
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-20 px-6 sm:px-8 border-t border-zinc-200/50 dark:border-zinc-800/50 transition-colors">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-905 dark:text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/55 dark:border-zinc-800/60 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-base font-semibold text-zinc-900 dark:text-white focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`h-5 w-5 text-zinc-500 transform transition-transform duration-200 ${
                      activeFaq === idx ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    activeFaq === idx ? "max-h-40 border-t border-zinc-100 dark:border-zinc-800" : "max-h-0"
                  }`}
                >
                  <div className="p-5 text-sm leading-relaxed text-zinc-650 dark:text-zinc-400">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Contact Section */}
      <section className="w-full max-w-7xl px-6 py-20 sm:px-8">
        <div className="relative isolate overflow-hidden bg-zinc-900 dark:bg-zinc-950 px-6 py-16 shadow-2xl sm:rounded-3xl sm:px-16 md:py-24 lg:flex lg:items-center lg:gap-x-20 lg:px-24">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]"></div>
          
          <div className="mx-auto max-w-md lg:mx-0 lg:flex-auto relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to claim your digital identity?
            </h2>
            <p className="mt-6 text-base leading-relaxed text-zinc-400">
              Submit your inquiry or schedule a direct broker chat. We help brands negotiate secure transfers and private acquisitions.
            </p>
            <div className="mt-10 flex items-center justify-start gap-x-6">
              <Link
                href="/Contact"
                className="rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 px-5 py-3 text-sm font-semibold shadow-sm transition-colors active:scale-95"
              >
                Inquire About a Domain
              </Link>
              <Link
                href="/Portfolio"
                className="text-sm font-semibold leading-6 text-white hover:text-zinc-300 flex items-center gap-1 group"
              >
                View Full Catalog
                <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-md lg:mt-0 relative z-10 flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm sm:p-8">
            <h3 className="text-lg font-bold text-white mb-4 self-start">Get Custom Domain Alerts</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed self-start">
              Receive updates whenever we acquire elite handpicked domains in technology, SaaS, and artificial intelligence.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thanks! We've registered your interest."); }} className="w-full flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Enter your work email"
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-550 border border-white/10 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 shadow-md active:scale-95 transition-all"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
