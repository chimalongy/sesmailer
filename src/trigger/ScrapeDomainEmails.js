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
      name: z.string().describe("Formal business name or clinic name."),
      website_url: z.string().url().nullable().describe("Direct website URL of the business."),
      email: z.string().nullable().describe("Public contact or inquiry email address if available."),
      phone: z.string().nullable().describe("Contact phone number.")
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

  const promptToUse = scrapePrompt || `Find local ${niche || "businesses"} and ${service || "services"} providing these services in ${location || "United States"}. Extract their business names and direct website URLs.`;

  let scrapedLeads = [];
  try {
    const app = new Firecrawl({ apiKey });
    const response = await app.agent({
      prompt: promptToUse,
      schema: businessLeadsSchema
    });

    if (response?.success && Array.isArray(response.data?.businesses)) {
      scrapedLeads = response.data.businesses;
    }
  } catch (scrapeErr) {
    console.error("[Scrape Domain Emails]: Firecrawl scraping error:", scrapeErr.message);
  }

  // 2. Parse scraped businesses into contact items
  const newContacts = [];
  for (const lead of scrapedLeads) {
    let leadEmail = lead.email;
    let leadDomain = "";

    if (lead.website_url) {
      try {
        const parsedUrl = new URL(lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`);
        leadDomain = parsedUrl.hostname.replace(/^www\./, "");
        if (!leadEmail) {
          leadEmail = `info@${leadDomain}`;
        }
      } catch (_) {
        leadDomain = domain;
      }
    }

    if (!leadEmail && lead.name) {
      const slug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      leadEmail = `contact@${slug}.com`;
      leadDomain = `${slug}.com`;
    }

    if (leadEmail) {
      newContacts.push({
        email: leadEmail.toLowerCase().trim(),
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
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
  },
  run: async (payload, { ctx }) => {
    console.log(`[Task ${ctx.run.id}]: Running Scrape Domain Emails for ${payload?.domain}...`);
    return await runScrapeDomainEmails(payload);
  },
});
