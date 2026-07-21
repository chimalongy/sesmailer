import Link from "next/link";

export const metadata = {
  title: "Blog - Domain Strategy & Insights | Genius Domain Names",
  description: "Expert articles on domain strategy, brand authority, SEO, geo domains, and how to pick a name that makes your business unforgettable.",
};

const posts = [
  {
    slug: "your-business-needs-a-genius-name",
    category: "Brand Strategy",
    categoryColor: "indigo",
    date: "July 18, 2026",
    readTime: "6 min read",
    title: "Your Business Needs a Genius Name",
    excerpt:
      "The domain name you choose today will define how customers find, remember, and trust your business for the next decade. Most companies get this wrong. Here is why it matters more than you think.",
    tags: ["Branding", "Domain Strategy", "Startup"],
    featured: true,
  },
  {
    slug: "why-exact-match-domains-matter",
    category: "SEO & Traffic",
    categoryColor: "violet",
    date: "July 10, 2026",
    readTime: "8 min read",
    title: "Why Exact Match Domains Still Matter in 2026",
    excerpt:
      "Despite years of algorithm updates, exact match domains continue to deliver measurable SEO and conversion advantages. The evidence is clear - and the window to act is closing.",
    tags: ["SEO", "Exact Match", "Traffic"],
    featured: false,
  },
  {
    slug: "what-are-geo-domains",
    category: "Geo Domains",
    categoryColor: "emerald",
    date: "July 3, 2026",
    readTime: "7 min read",
    title: "What Are Geo Domains and Their Impact on Your Business",
    excerpt:
      "Location-specific domains are one of the most underrated assets in local business marketing. Learn how geo domains drive direct navigation traffic, local SEO rankings, and trust in your target market.",
    tags: ["Geo Domains", "Local SEO", "Lead Gen"],
    featured: false,
  },
];

const categoryColors = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
};

export default function Blog() {
  const [featured, ...rest] = posts;

  return (
    <div className="w-full flex flex-col items-center">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 py-20 lg:py-28 px-6 sm:px-8">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-200/20">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
            Domain Insights & Strategy
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            The{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Genius Domain
            </span>{" "}
            Blog
          </h1>
          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Expert perspectives on domain strategy, brand authority, SEO impact, and how to secure
            the digital assets that give your business an unfair competitive advantage.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="w-full max-w-7xl px-6 sm:px-8 pt-16 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">Featured Article</p>
        <Link href={`/Blog/${featured.slug}`} className="group block">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 sm:p-12 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_-20%,rgba(255,255,255,0.08),transparent)]" />
            <div className="relative z-10 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center rounded-full bg-white/20 border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                  {featured.category}
                </span>
                <span className="text-xs text-indigo-200">{featured.date}</span>
                <span className="text-xs text-indigo-200">{featured.readTime}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight group-hover:text-indigo-100 transition-colors">
                {featured.title}
              </h2>
              <p className="mt-4 text-base text-indigo-100 leading-relaxed max-w-xl">
                {featured.excerpt}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-indigo-100 transition-colors">
                  Read Article
                  <svg className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <div className="flex flex-wrap gap-2">
                  {featured.tags.map((t) => (
                    <span key={t} className="text-xs font-medium text-indigo-200 bg-white/10 rounded-lg px-2.5 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* All Posts Grid */}
      <section className="w-full max-w-7xl px-6 sm:px-8 pt-12 pb-20">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">More Articles</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((post) => (
            <Link key={post.slug} href={`/Blog/${post.slug}`} className="group block">
              <article className="h-full flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-7 shadow-sm hover:shadow-lg dark:hover:border-zinc-700/80 transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[post.categoryColor]}`}>
                    {post.category}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span>{post.date}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug transition-colors mb-3">
                  {post.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((t) => (
                      <span key={t} className="text-xs font-medium text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-1">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 transition-colors flex-shrink-0">
                    Read
                    <svg className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-14 px-6 sm:px-8 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Ready to act on what you read?</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-5">Browse Our Premium Domain Portfolio</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/Portfolio" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 transition-colors active:scale-95">
              Browse All Domains
            </Link>
            <Link href="/Contact" className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition-colors active:scale-95">
              Talk to a Broker
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}