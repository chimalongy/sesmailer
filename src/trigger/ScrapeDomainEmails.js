import { task, tasks } from "@trigger.dev/sdk/v3";
import { Firecrawl } from "firecrawl";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getAvailableFirecrawlApiKey } from "@/lib/Ai/getapis";
import { runVerifyCampaignContacts } from "./verifyCampaignContacts";

// Schema for Firecrawl agent business lead extraction
const businessLeadsSchema = z.object({
  businesses: z.array(
    z.object({
      business_name: z.string().nullable().describe("Formal business name or clinic name."),
      website: z.string().describe("COMPULSORY: Direct website URL of the business. Must exist."),
      owner_name: z.string().nullable().describe("Business owner or decision maker's full name if found."),
      owner_email: z.string().nullable().describe("Business owner or direct contact email address if found.")
    })
  )
});

/**
 * Helper function to execute domain email scraping and lead merging
 */
export async function runScrapeDomainEmails({ domain, location, niche, service, scrapePrompt, userContacts = [] }) {
  console.log(`[Scrape Domain Emails]: Starting Firecrawl scraper for "${domain}"...`);

  // Dynamically acquire active Firecrawl API key with available daily usage capacity (< 5 uses today)
  const keyConfig = await getAvailableFirecrawlApiKey();
  const apiKey = keyConfig?.apiKey;

  if (!apiKey) {
    console.warn("[Scrape Domain Emails]: No available Firecrawl API key found. Skipping web scraping.");
    // Fall back directly to verify user contacts
    await triggerVerification(domain, userContacts);
    return { success: false, reason: "Firecrawl API key unavailable", contacts: userContacts };
  }

  const promptToUse = scrapePrompt || `You are an expert lead generation and market research agent. Search Google Maps first then Google to find local ${niche || "businesses"} and ${service || "services"} providing these services in ${location || "United States"}. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found.`;

  let scrapedLeads = [];
  try {
    const app = new Firecrawl({ apiKey });
    const response = await app.agent({
      prompt: promptToUse,
      schema: businessLeadsSchema
    });

    console.log(`[Scrape Domain Emails]: Firecrawl agent response status: ${response?.success ? "success" : "failed"}`);

    const rawData = response?.data;
    if (rawData) {
      if (Array.isArray(rawData)) {
        scrapedLeads = rawData;
      } else if (Array.isArray(rawData.businesses)) {
        scrapedLeads = rawData.businesses;
      } else if (typeof rawData.businesses === "object" && rawData.businesses !== null) {
        scrapedLeads = Object.values(rawData.businesses);
      } else if (typeof rawData === "object" && rawData !== null) {
        scrapedLeads = Object.values(rawData);
      }
    }
  } catch (scrapeErr) {
    console.error("[Scrape Domain Emails]: Firecrawl scraping error:", scrapeErr.message);
  }

  // 2. Parse scraped businesses into contact items (website URL is compulsory)
  const newContacts = [];
  for (const lead of scrapedLeads) {
    if (!lead || typeof lead !== "object") continue;

    const websiteUrl = lead.website || lead.website_url || lead.url || lead.link;
    if (!websiteUrl || typeof websiteUrl !== "string") continue; // Compulsory check: website URL must exist

    const businessName = lead.business_name || lead.name || null;
    const ownerName = lead.owner_name || lead.owner || null;
    let leadEmail = lead.owner_email || lead.email || lead.contact_email || null;

    let leadDomain = "";
    try {
      const parsedUrl = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
      leadDomain = parsedUrl.hostname.replace(/^www\./, "");
    } catch (_) {
      leadDomain = domain;
    }

    if (!leadEmail && leadDomain) {
      leadEmail = `info@${leadDomain}`;
    }

    if (leadEmail) {
      newContacts.push({
        email: leadEmail.toLowerCase().trim(),
        ownerName: ownerName || null,
        businessName: businessName || null,
        businessDomain: leadDomain || domain,
        deliveryStatus: "Sent"
      });
    }
  }

  // 3. Merge user-provided contacts with AI-scraped contacts (deduplicate by email)
  const mergedContacts = [...userContacts];
  for (const c of newContacts) {
    const existing = mergedContacts.some((item) => item.email.toLowerCase() === c.email.toLowerCase());
    if (!existing) {
      mergedContacts.push(c);
    }
  }

  console.log(`[Scrape Domain Emails]: Merged ${userContacts.length} user contacts with ${newContacts.length} scraped contacts. Total: ${mergedContacts.length}`);

  // 4. Update campaign contacts list in Neon Postgres
  if (domain) {
    try {
      await sql(
        `UPDATE outbounds SET contacts = $1 WHERE LOWER(domain) = LOWER($2)`,
        [JSON.stringify(mergedContacts), domain.toLowerCase().trim()]
      );
      console.log(`[Scrape Domain Emails]: Updated merged contact list in Neon Postgres for "${domain}".`);
    } catch (dbErr) {
      console.error("[Scrape Domain Emails]: DB update error:", dbErr.message);
    }
  }

  // 5. Immediately trigger 8-step contact verification task on merged contacts list
  await triggerVerification(domain, mergedContacts);

  return {
    success: true,
    domain,
    scrapedCount: newContacts.length,
    userCount: userContacts.length,
    mergedCount: mergedContacts.length,
    contacts: mergedContacts
  };
}

async function triggerVerification(domain, contacts) {
  try {
    if (process.env.TRIGGER_SECRET_KEY) {
      await tasks.trigger("verify-campaign-contacts", {
        domain,
        contacts
      });
    } else {
      runVerifyCampaignContacts(domain, contacts).catch((err) => {
        console.error("[Scrape Domain Emails]: Background verification error:", err);
      });
    }
  } catch (err) {
    console.warn("[Scrape Domain Emails]: Trigger.dev task trigger warning, running inline:", err.message);
    runVerifyCampaignContacts(domain, contacts).catch((err) => {
      console.error("[Scrape Domain Emails]: Background verification error:", err);
    });
  }
}

/**
 * Trigger.dev task definition for Scrape Domain Emails
 */
export const scrapeDomainEmailsTask = task({
  id: "scrape-domain-emails",
  maxDuration: 7200,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
  },
  run: async (payload, { ctx }) => {
    console.log(`[Task ${ctx.run.id}]: Running Scrape Domain Emails for ${payload?.domain}...`);
    return await runScrapeDomainEmails(payload);
  },
});
