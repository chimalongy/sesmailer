"use client";

import { useState } from "react";
import Link from "next/link";

const categories = ["All", "New Listings", "Exclusive Offers", "Market Trends", "Platform News"];

const updates = [
  {
    id: 1,
    category: "New Listings",
    badge: "Just Listed",
    badgeColor: "indigo",
    date: "July 21, 2026",
    title: "5 Elite AI-Category Domains Now Available",
    excerpt: "We have added five hand-selected, high-impact AI domain names to our portfolio - perfect for LLM startups, automation platforms, and next-gen developer tools.",
    domains: ["neurova.ai", "promptcore.io", "synaptix.ai"],
    cta: { label: "Browse Listings", href: "/Portfolio" },
    highlight: false,
  },
  {
    id: 2,
    category: "Exclusive Offers",
    badge: "Limited Time",
    badgeColor: "violet",
    date: "July 19, 2026",
    title: "Flash Deal: FinTech Bundle - Save Up to 30%",
    excerpt: "For a limited time, acquire any two domains from our FinTech collection at a combined discount. Secure your digital identity in payments, banking, and DeFi before competitors do.",
    domains: ["wealthly.io", "paybridge.co"],
    cta: { label: "See Offer", href: "/Contact?subject=FinTech Bundle Offer" },
    highlight: true,
  },
  {
    id: 3,
    category: "Market Trends",
    badge: "Insight",
    badgeColor: "emerald",
    date: "July 16, 2026",
    title: "Premium .AI Domains Hit All-Time High Valuations",
    excerpt: "With generative AI investment surging past $100B globally, our market analysis confirms .ai domain aftermarket prices have risen 4x since 2023. Locking in today is a strategic move.",
    domains: [],
    cta: { label: "Explore AI Domains", href: "/Portfolio?search=ai" },
    highlight: false,
  },
  {
    id: 4,
    category: "Platform News",
    badge: "Update",
    badgeColor: "zinc",
    date: "July 14, 2026",
    title: "Flexible Installment Plans Now Available on All Listings",
    excerpt: "We have partnered with Dan.com to offer lease-to-own and split-payment options on every domain in our portfolio. Secure elite assets without upfront capital pressure.",
    domains: [],
    cta: { label: "Learn More", href: "/About" },
    highlight: false,
  },
  {
    id: 5,
    category: "New Listings",
    badge: "Just Listed",
    badgeColor: "indigo",
    date: "July 10, 2026",
    title: "HealthTech & BioTech Expansion: 8 New Names Added",
    excerpt: "Our curators have added a premium batch of healthcare-adjacent domains - ideal for telehealth platforms, digital diagnostics, and biotech branding.",
    domains: ["medaxis.com", "bioverge.io", "cliniqly.co"],
    cta: { label: "Browse Listings", href: "/Portfolio?search=health" },
    highlight: false,
  },
  {
    id: 6,
    category: "Exclusive Offers",
    badge: "Early Access",
    badgeColor: "violet",
    date: "July 7, 2026",
    title: "VIP Subscriber Early Access: 3 Unreleased Domains",
    excerpt: "Subscribers on our domain alert list got first-look access to three rare, one-word .com assets before public listing. Subscribe below to never miss another early-access drop.",
    domains: ["flowbase.com"],
    cta: { label: "Subscribe for Alerts", href: "#subscribe" },
    highlight: false,
  },
];

const badgeStyles = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-200/30 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/30",
  violet: "bg-violet-50 text-violet-600 border-violet-200/30 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/30",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30",
  zinc: "bg-zinc-100 text-zinc-600 border-zinc-200/30 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/30",
};

const benefits = [
  {
    title: "Early Access Drops",
    desc: "Get notified before premium domains go public - giving you a head start on securing category-defining names.",
    iconPath: "M12 3v2m6.364.636-1.414 1.414M21 12h-2M17.778 17.778l-1.414-1.414M12 21v-2M6.636 17.778l1.414 1.414M3 12h2M6.222 6.222l1.414 1.414",
  },
  {
    title: "Flash Discounts",
    desc: "Time-sensitive bundles and individual pricing breaks - exclusively for our subscriber community.",
    iconPath: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
  },
  {
    title: "Market Intelligence",
    desc: "Monthly insights on aftermarket trends, valuation shifts, and sector-specific domain investment opportunities.",
    iconPath: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    title: "Curated Alerts",
    desc: "Receive custom domain alerts for specific keywords, TLDs, or industry verticals that match your brand-building goals.",
    iconPath: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  },
];

export default function LatestUpdates() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filtered = activeCategory === "All" ? updates : updates.filter((u) => u.category === activeCategory);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setSubscribed(true);
      setSubscribeEmail("");
    }
  };

  return (
    <div className="w-full flex flex-col items-center">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 py-20 lg:py-28 px-6 sm:px-8">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-200/20">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
            Live Updates &amp; Exclusive Offers
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Latest Updates &amp;{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Exclusive Deals
            </span>
          </h1>
          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Stay ahead of the market. We share our newest domain additions, time-sensitive
            offers, and insider market intelligence right here, first.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-12">
            {[
              { label: "Domains Listed", value: "200+" },
              { label: "Updates This Month", value: "12" },
              { label: "Active Subscribers", value: "1,400+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="w-full max-w-7xl px-6 sm:px-8 pt-12 pb-2">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Updates Grid */}
      <section className="w-full max-w-7xl px-6 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filtered.map((update) => (
            <article
              key={update.id}
              className={`group flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                update.highlight
                  ? "bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-500/20 text-white shadow-xl shadow-indigo-500/20"
                  : "bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-lg dark:hover:border-zinc-700/80 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    update.highlight ? "bg-white/20 text-white border-white/20" : badgeStyles[update.badgeColor]
                  }`}
                >
                  {update.badge}
                </span>
                <span className={`text-[11px] font-medium ${update.highlight ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"}`}>
                  {update.date}
                </span>
              </div>
              <div className="flex-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 block ${update.highlight ? "text-indigo-200" : "text-indigo-500 dark:text-indigo-400"}`}>
                  {update.category}
                </span>
                <h2 className={`text-lg font-bold leading-snug mb-3 ${update.highlight ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                  {update.title}
                </h2>
                <p className={`text-sm leading-relaxed ${update.highlight ? "text-indigo-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {update.excerpt}
                </p>
              </div>
              {update.domains.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {update.domains.map((d) => (
                    <span key={d} className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold font-mono ${update.highlight ? "bg-white/15 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}>
                      {d}
                    </span>
                  ))}
                </div>
              )}
              <div className={`mt-6 pt-5 border-t flex ${update.highlight ? "border-white/20" : "border-zinc-100 dark:border-zinc-800"}`}>
                <Link
                  href={update.cta.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-all group/link ${
                    update.highlight
                      ? "text-white hover:text-indigo-100"
                      : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                  }`}
                >
                  {update.cta.label}
                  <svg className="h-4 w-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No updates in this category yet.</p>
          </div>
        )}
      </section>

      {/* Why Subscribe */}
      <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-20 px-6 sm:px-8 border-y border-zinc-200/50 dark:border-zinc-800/50">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Why Subscribe?</h2>
            <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">What You Will Receive</p>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-base">Our subscribers are the first to know and the first to act.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((item, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section id="subscribe" className="w-full max-w-7xl px-6 py-20 sm:px-8">
        <div className="relative isolate overflow-hidden bg-zinc-900 dark:bg-zinc-950 px-6 py-16 shadow-2xl sm:rounded-3xl sm:px-16 md:py-24 lg:flex lg:items-center lg:gap-x-20 lg:px-24">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
          <div className="mx-auto max-w-md lg:mx-0 lg:flex-auto relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400 mb-5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Free - No Spam
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Never Miss an Exclusive Offer</h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400">
              Join 1,400+ brand builders, startup founders, and domain investors who receive our exclusive updates, flash deals, and market insights every week.
            </p>
            <ul className="mt-6 space-y-2">
              {["No cost to subscribe", "Unsubscribe any time", "Early access to every new listing"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
                  <svg className="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto mt-16 max-w-md lg:mt-0 w-full relative z-10 flex flex-col bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm sm:p-8">
            {subscribed ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-white font-bold text-lg">You are on the list!</p>
                <p className="text-zinc-400 text-sm">Watch your inbox - your first update is on its way.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-1">Get Domain Alerts and Deals</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Enter your work email to subscribe instantly.</p>
                <form onSubmit={handleSubscribe} className="w-full flex flex-col gap-3">
                  <input
                    id="latest-updates-email"
                    type="email"
                    required
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-500 border border-white/10 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Subscribe - It is Free
                  </button>
                </form>
                <p className="text-[11px] text-zinc-500 mt-4 text-center">
                  We respect your privacy. Read our{" "}
                  <Link href="/Privacy" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
                    Privacy Policy
                  </Link>.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-14 px-6 sm:px-8 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Ready to acquire?</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-5">Explore the Full Premium Portfolio</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/Portfolio" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 transition-colors active:scale-95">
              Browse All Domains
            </Link>
            <Link href="/Contact" className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition-colors active:scale-95">
              Contact a Broker
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}