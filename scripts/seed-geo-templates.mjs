/**
 * seed-geo-templates.mjs
 *
 * Seeds 6 geo-domain outreach templates into the database:
 *   3 angles × (FirstOutbound + FollowUp)
 *
 *   1. Competitive Edge  — fear of a competitor snapping it up
 *   2. Direct Enquiry    — ultra-short, no-frills ask
 *   3. Value Pitch       — local SEO / lead-gen value angle
 *
 * Token placeholders (resolved at send-time by compileTemplateText):
 *   [domain]      → campaign domain name
 *   [location]        → location (capitalized)     e.g. Long Island
 *   [location]        → location (lowercased)      e.g. long island
 *   [service]       → service (capitalized)    e.g. Real Estate Agents
 *   [service]       → service (lowercased)     e.g. real estate agents
 *   [personaName] → sender persona name
 *   [price]       → asking price (PriceChange templates only)
 *
 * Usage:
 *   node scripts/seed-geo-templates.mjs
 *
 * Requires: next dev running on http://localhost:3000
 */

const BASE_URL = "http://localhost:3000";

const templates = [

  // ══════════════════════════════════════════════════════════════
  // 1. COMPETITIVE EDGE
  // ══════════════════════════════════════════════════════════════

  {
    name: "Geo — Competitive Edge (Opener)",
    category: "FirstOutbound",
    subject: "[domain] — before a competitor grabs it",
    message: `Hi,

I own [domain] and wanted to reach out to a [location]-based [service] business before listing it publicly.

Exact-match local domains like this tend to go quickly once they're visible — and in a competitive market like [location] [service], whoever holds the domain has an immediate edge in search and direct traffic.

Wanted to offer you first look before that happens.

Worth a quick reply?

[personaName]`
  },

  {
    name: "Geo — Competitive Edge (Follow-Up)",
    category: "FollowUp",
    subject: "Re: [domain] — still available (for now)",
    message: `Hi,

Just a quick follow-up on [domain].

A few [location] [service] businesses have already expressed interest since my last note — once I move it to a public listing, it opens up to everyone operating in your space.

If you'd rather control who ends up with it, now is a good time to reach out.

[personaName]`
  },

  // ══════════════════════════════════════════════════════════════
  // 2. DIRECT ENQUIRY
  // ══════════════════════════════════════════════════════════════

  {
    name: "Geo — Direct Enquiry (Opener)",
    category: "FirstOutbound",
    subject: "Quick question about [domain]",
    message: `Hi,

I own [domain] and thought it might be a good fit for your [location] [service] operation.

Any interest in acquiring it?

[personaName]`
  },

  {
    name: "Geo — Direct Enquiry (Follow-Up)",
    category: "FollowUp",
    subject: "Re: Quick question about [domain]",
    message: `Hi,

Following up on [domain] — still available if there's any interest on your end.

Happy to answer questions or discuss terms. Just reply here.

[personaName]`
  },

  // ══════════════════════════════════════════════════════════════
  // 3. VALUE PITCH
  // ══════════════════════════════════════════════════════════════

  {
    name: "Geo — Value Pitch (Opener)",
    category: "FirstOutbound",
    subject: "Thought this might help your [location] rankings",
    message: `Hi,

I own [domain] and thought it could be genuinely useful for a [location]-based [service] business like yours.

Here's why local businesses pick up geo-match domains:

- Exact-match location + service names still carry meaningful local SEO weight
- Customers who type it directly land on you, not a directory or competitor
- A dedicated landing page on this domain can capture [location]-specific leads separately from your main site

It's a straightforward asset — happy to share what similar [location] [service] domains have sold for if that gives you useful context.

Worth a quick reply?

[personaName]`
  },

  {
    name: "Geo — Value Pitch (Follow-Up)",
    category: "FollowUp",
    subject: "Re: [domain] — the local SEO case",
    message: `Hi,

Following up briefly on [domain].

For [location] [service] businesses, the core value is simple: owning the exact-match domain means anyone searching "[service] [location]" who lands on your domain is already primed to convert — no ad spend required, no fighting algorithm changes.

Happy to share comps for what similar [location]-[service] domains have gone for recently if that helps frame the decision.

[personaName]`
  },

];

// ── POST each template ────────────────────────────────────────────────────────
async function run() {
  console.log("\n\uD83D\uDCDD Geo Domain Template Seeder");
  console.log("-".repeat(50));
  console.log("  Templates to seed : " + templates.length);
  console.log("  Endpoint          : " + BASE_URL + "/api/templates");
  console.log("-".repeat(50) + "\n");

  let created = 0;
  let failed = 0;

  for (const tpl of templates) {
    process.stdout.write("  \u23F3 " + tpl.name + " ... ");

    const res = await fetch(BASE_URL + "/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tpl),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      console.log("\u2705 Created (id: " + data.id + ")");
      created++;
    } else {
      console.log("\u274C Failed — " + (data.error || res.status));
      failed++;
    }
  }

  console.log("\n" + "-".repeat(50));
  console.log("  \u2705 Created : " + created);
  if (failed > 0) console.log("  \u274C Failed  : " + failed);
  console.log("-".repeat(50));
  console.log("\n\uD83D\uDCA1 Templates are now available in the Add Task modal");
  console.log("   under 'Outreach Template' for any geo domain campaign.\n");
}

run().catch((err) => {
  console.error("\u274C Unexpected error:", err.message);
  process.exit(1);
});
