/**
 * seed-geo-sequence.mjs
 *
 * Creates a new outbound campaign pre-loaded with the full 5-stage
 * geo-domain cold email sequence from:
 *   domain-sales-letter/geo-domain-cold-outbound-campaign.md
 *
 * Usage:
 *   node scripts/seed-geo-sequence.mjs [domain] [location] [service] [price]
 *
 * Examples:
 *   node scripts/seed-geo-sequence.mjs AustinPlumbers.com Austin Plumbers 8500
 *   node scripts/seed-geo-sequence.mjs LagosRealEstate.com Lagos "Real Estate" 12000
 *
 * Requires: next dev running on http://localhost:3000
 */

const BASE_URL = "http://localhost:3000";

// ── CLI args ──────────────────────────────────────────────────────────────────
const [, , argDomain, argLocation, argService, argPrice] = process.argv;

if (!argDomain || !argLocation || !argService) {
  console.error(
    "\nUsage: node scripts/seed-geo-sequence.mjs <domain> <location> <service> [price]\n" +
    "Example: node scripts/seed-geo-sequence.mjs AustinPlumbers.com Austin Plumbers 8500\n"
  );
  process.exit(1);
}

const DOMAIN   = argDomain;
const LOCATION = argLocation;
const SERVICE  = argService;
const PRICE    = argPrice || null;

// ── Date helpers ──────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

const addDays = (baseDate, days) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// ── Token replacer ────────────────────────────────────────────────────────────
const fill = (text) =>
  text
    .replaceAll("[domain.com]", DOMAIN)
    .replaceAll("[domain]",     DOMAIN)
    .replaceAll("[location]",   LOCATION)
    .replaceAll("[service]",    SERVICE)
    .replaceAll("[Service]",    SERVICE.charAt(0).toUpperCase() + SERVICE.slice(1))
    .replaceAll("[$X\u2013$Y]", PRICE ? `$${Number(PRICE).toLocaleString()}` : "[$X-$Y]")
    .replaceAll("[Your Name]",  "Portfolio Manager");

// ── Sequence definition (mirrors geo-domain-cold-outbound-campaign.md) ────────
const LAUNCH_DATE = today();

const buildSequence = () => [
  // Stage 1 — Day 0: The Opener
  {
    task_id:      "task-geo-1-" + Date.now(),
    task_type:    "FirstOutbound",
    task_status:  "scheduled",
    task_subject: fill("Domain for [location] [service] businesses"),
    task_message: fill(
      "Hi,\n\n" +
      "I own [domain.com] and thought it could be a strong fit for a [location]-based [service] business like yours — " +
      "exact-match local domains like this tend to help with both direct-navigation online traffic and local search relevance.\n\n" +
      "Wanted to check if it's something you'd have interest in before offering it elsewhere.\n\n" +
      "Worth a quick reply?\n\n" +
      "Portfolio Manager"
    ),
    schedule_date: addDays(LAUNCH_DATE, 0),
    created_at:    new Date().toISOString(),
  },

  // Stage 2 — Day 4: Local SEO / Lead-Gen Value
  {
    task_id:      "task-geo-2-" + (Date.now() + 1),
    task_type:    "follow up",
    task_status:  "scheduled",
    task_subject: fill("Re: Domain for [location] [service] businesses"),
    task_message: fill(
      "Hi,\n\n" +
      "Following up briefly. A few reasons a domain like this tends to help local businesses specifically:\n\n" +
      "- Exact-match location + service names still carry meaningful local SEO weight\n" +
      "- Easy for customers to remember and type directly (reduces reliance on ads)\n" +
      "- Can be pointed to a dedicated landing page to capture [location]-specific leads separately from your main site\n\n" +
      "Happy to share what similar location-service domains have gone for if that's useful context.\n\n" +
      "Portfolio Manager"
    ),
    schedule_date: addDays(LAUNCH_DATE, 4),
    created_at:    new Date().toISOString(),
  },

  // Stage 3 — Day 9: Comps / Price Anchor
  {
    task_id:      "task-geo-3-" + (Date.now() + 2),
    task_type:    "follow up",
    task_status:  "scheduled",
    task_subject: "What domains like this typically go for",
    task_message: fill(
      "Hi,\n\n" +
      "For context — geo-match domains in mid-size markets for [service] have generally sold in the [$X\u2013$Y] range, " +
      "with larger metro areas trending higher. Not pushing a number on you, just want you to have a realistic sense before deciding.\n\n" +
      "If it's not the right time, understood — I'll likely list it more broadly after this week, " +
      "which usually opens it up to competitors in the space too.\n\n" +
      "Portfolio Manager"
    ),
    schedule_date: addDays(LAUNCH_DATE, 9),
    created_at:    new Date().toISOString(),
  },

  // Stage 4 — Day 14: Soft Deadline
  {
    task_id:      "task-geo-4-" + (Date.now() + 3),
    task_type:    "follow up",
    task_status:  "scheduled",
    task_subject: fill("Closing this out — [domain.com]"),
    task_message: fill(
      "Hi,\n\n" +
      "Wanted to close the loop on this — I'll be moving [domain.com] to a broader listing this week unless there's interest on your end.\n\n" +
      "If timing's just off, no worries — happy to reconnect down the line if things change.\n\n" +
      "All the best,\n" +
      "Portfolio Manager"
    ),
    schedule_date: addDays(LAUNCH_DATE, 14),
    created_at:    new Date().toISOString(),
  },

  // Stage 5 — Day 30+: Long-Tail Re-engagement
  {
    task_id:      "task-geo-5-" + (Date.now() + 4),
    task_type:    "follow up",
    task_status:  "scheduled",
    task_subject: "Still available if useful later",
    task_message: fill(
      "Hi,\n\n" +
      "No response needed — just flagging [domain.com] is still available if plans change. " +
      "This'll be my last note on it.\n\n" +
      "Portfolio Manager"
    ),
    schedule_date: addDays(LAUNCH_DATE, 30),
    created_at:    new Date().toISOString(),
  },
];

// ── Full campaign payload ─────────────────────────────────────────────────────
const buildPayload = () => ({
  id:              "out-geo-" + Date.now(),
  domain:          DOMAIN,
  industry:        `${SERVICE} businesses in ${LOCATION}`,
  template:        "Geo Domain Campaign",
  date:            LAUNCH_DATE,
  status:          "Sent",
  defaultSendTime: "09:00",
  selling_price:   PRICE ? String(PRICE) : null,
  contacts:        [],   // add real prospect emails via the Outbounds UI after creation
  tasks:           buildSequence(),
  persona: {
    name:     "Portfolio Manager",
    position: "Domain Acquisitions Desk",
    email:    "broker@geniusdomainnames.com",
    tone:     "Professional",
  },
});

// ── Run ───────────────────────────────────────────────────────────────────────
async function run() {
  const payload = buildPayload();
  const DAY_OFFSETS = [0, 4, 9, 14, 30];

  console.log("\n\uD83D\uDCCD Geo Domain Sequence Seeder");
  console.log("-".repeat(44));
  console.log("  Domain   : " + DOMAIN);
  console.log("  Location : " + LOCATION);
  console.log("  Service  : " + SERVICE);
  console.log("  Price    : " + (PRICE ? "$" + Number(PRICE).toLocaleString() : "not set"));
  console.log("  Launch   : " + LAUNCH_DATE);
  console.log("  Stages   : " + payload.tasks.length + " emails scheduled");
  console.log("-".repeat(44));

  payload.tasks.forEach((t, i) => {
    const day = String(DAY_OFFSETS[i]).padStart(2);
    console.log("  Stage " + (i + 1) + " (Day " + day + ") [" + t.schedule_date + "] — " + t.task_subject);
  });

  console.log("\n\u23F3 Saving to database via POST /api/outbounds ...\n");

  const res = await fetch(BASE_URL + "/api/outbounds", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("\u274C Failed to save campaign:", data.error || JSON.stringify(data));
    process.exit(1);
  }

  console.log("\u2705 Campaign saved successfully!");
  console.log("   Campaign ID : " + data.id);
  console.log("   View at     : " + BASE_URL + "/admin/dashboard/outbounds/" + encodeURIComponent(DOMAIN));
  console.log("\n\uD83D\uDCA1 Next steps:");
  console.log("   1. Open the campaign link above in your browser");
  console.log("   2. Add prospect contacts (local businesses found via Google/Maps/LinkedIn)");
  console.log("   3. Set your sender persona if not already configured");
  console.log("   4. Review and personalise each stage email body as needed\n");
}

run().catch((err) => {
  console.error("\u274C Unexpected error:", err.message);
  process.exit(1);
});
