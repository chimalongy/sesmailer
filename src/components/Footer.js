import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200/50 bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-base shadow-sm">
                G
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Genius<span className="text-indigo-600 dark:text-indigo-400 font-semibold">DomainNames</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-sm">
              Acquiring and curating premier digital real estate. We help startups, creators, and businesses establish absolute brand authority with elite domain names.
            </p>
            {/* Safe Transfer badges */}
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-3">
                Secure Transactions Via
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Escrow.com
                </span>
                <span className="inline-flex items-center rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  SEDO
                </span>
                <span className="inline-flex items-center rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Dan.com
                </span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-100">
                  Explore
                </h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li>
                    <Link
                      href="/"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/Portfolio"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Premium Portfolio
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/Blog"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/latest-updates"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Latest Updates
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/About"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-100">
                  Inquiries
                </h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li>
                    <Link
                      href="/Contact"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Make an Offer
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:inquiries@geniusdomainnames.com"
                      className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Email Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-100">
                Legal
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/Privacy"
                    className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Terms"
                    className="text-sm leading-6 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-zinc-200/50 pt-8 dark:border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">
            &copy; {currentYear} Genius Domain Names. All rights reserved. Handpicked Premium Domains.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600">
            <svg
              className="h-4 w-4 text-emerald-500"
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
            SSL Secured & Verified Domain Transfers
          </div>
        </div>
      </div>
    </footer>
  );
}
