import Link from "next/link";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-905 dark:text-white">
          About Genius Domain Names
        </h1>
        <p className="mt-3 text-lg text-zinc-650 dark:text-zinc-400">
          We acquire and license elite, handpicked digital real estate to help forward-thinking companies establish instant authority.
        </p>
      </div>

      {/* Main Philosophy */}
      <div className="space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Our Vision
            </h2>
            <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-400">
              In the modern web ecosystem, your domain name is your singular most critical brand asset. It determines search index efficiency, click-through rates, advertising conversion, and the level of immediate trust customers place in your enterprise.
            </p>
            <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-400">
              At Genius Domain Names, we skip the bulk registrations and focus strictly on high-impact, brandable, one-word, or logical compound assets. We acquire premium names in growth sectors like Artificial Intelligence, SaaS, FinTech, and healthcare to bridge the gap between startups and absolute category authority.
            </p>
          </div>
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl p-8 text-white shadow-lg flex flex-col justify-center min-h-[220px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mb-2">Portfolio Mandate</span>
            <blockquote className="text-lg font-medium leading-relaxed">
              "We believe a premium domain is not a cost, but a permanent capital investment that pays dividends in branding, credibility, and traffic every single day."
            </blockquote>
          </div>
        </section>

        {/* Pillars Grid */}
        <section className="pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8 text-center">
            How We Curate Our Portfolio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 p-6 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">1. Strict Brandability</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Every domain in our catalog must pass rigorous phonetic and recall testing. If a name isn't easy to pronounce or remember, it doesn't make our list.
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 p-6 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">2. High Utility & SEO</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                We select prefixes, suffixes, and keywords that align with organic search volume, developer indexing patterns, and modern product naming trends.
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 p-6 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">3. Clear Ownership</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                All domains in our inventory are owned outright by Genius Domain Names under clean WHOIS registry history, guaranteeing quick transfer permissions.
              </p>
            </div>
          </div>
        </section>

        {/* Secure Transfers */}
        <section className="bg-zinc-100 dark:bg-zinc-950 rounded-3xl p-8 border border-zinc-200/30 dark:border-zinc-800/30 text-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
            Secure Brokerage & Stealth Acquisitions
          </h2>
          <p className="text-sm text-zinc-650 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
            Looking for a specific domain name that is currently registered by someone else? Our stealth acquisition specialists negotiate private deals anonymously, helping you secure target domains at fair market value without bidding wars.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/Contact?subject=Stealth Acquisition Inquiry"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Request Stealth Acquisition
            </Link>
            <Link
              href="/Portfolio"
              className="inline-flex items-center justify-center bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-xs font-semibold transition-colors cursor-pointer"
            >
              Browse Catalog
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
