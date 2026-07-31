import { task, tasks } from "@trigger.dev/sdk/v3";
import { analyzeDomainForScraping } from "@/lib/Ai/LLM-central";
import { runScrapeDomainEmails } from "./ScrapeDomainEmails";
import { runVerifyCampaignContacts } from "./verifyCampaignContacts";

/**
 * Helper function to run Domain Analyzer logic (used both by Trigger.dev task and inline fallback)
 */
export async function runDomainAnalyzer(domain, autoFetch = true, userContacts = []) {
  console.log(`[Domain Analyzer]: Starting AI analysis for domain "${domain}"...`);

  if (!domain) {
    throw new Error("Domain name is required for domain analysis.");
  }

  // 1. Execute LLM domain analysis (saves location, niche, service, scrape_prompt into portfolio domains table)
  const analysisResult = await analyzeDomainForScraping(domain);
  const { location, niche, service, scrapePrompt } = analysisResult;

  console.log(
    `[Domain Analyzer]: Analysis complete for "${domain}" -> Location: "${location}", Niche: "${niche}", Service: "${service}"`
  );

  // 2. Route next stage based on autoFetch flag
  if (autoFetch) {
    console.log(`[Domain Analyzer]: autoFetch enabled. Triggering Firecrawl AI domain email scraper...`);
    try {
      if (process.env.TRIGGER_SECRET_KEY) {
        await tasks.trigger("scrape-domain-emails", {
          domain,
          location,
          niche,
          service,
          scrapePrompt,
          userContacts
        });
      } else {
        // Run inline fallback execution
        runScrapeDomainEmails({ domain, location, niche, service, scrapePrompt, userContacts }).catch((err) => {
          console.error("[Domain Analyzer]: Background scraping error:", err);
        });
      }
    } catch (err) {
      console.warn("[Domain Analyzer]: Trigger.dev task trigger warning, executing inline:", err.message);
      runScrapeDomainEmails({ domain, location, niche, service, scrapePrompt, userContacts }).catch((err) => {
        console.error("[Domain Analyzer]: Background scraping error:", err);
      });
    }
  } else {
    console.log(`[Domain Analyzer]: autoFetch disabled. Triggering email verifier directly...`);
    try {
      if (process.env.TRIGGER_SECRET_KEY) {
        await tasks.trigger("verify-campaign-contacts", {
          domain,
          contacts: userContacts
        });
      } else {
        runVerifyCampaignContacts(domain, userContacts).catch((err) => {
          console.error("[Domain Analyzer]: Background verification error:", err);
        });
      }
    } catch (err) {
      console.warn("[Domain Analyzer]: Trigger.dev task trigger warning, executing inline:", err.message);
      runVerifyCampaignContacts(domain, userContacts).catch((err) => {
        console.error("[Domain Analyzer]: Background verification error:", err);
      });
    }
  }

  return {
    success: true,
    domain,
    analysisResult
  };
}

/**
 * Trigger.dev task definition for Domain Analyzer
 */
export const domainAnalyzerTask = task({
  id: "domain-analyzer",
  maxDuration: 180,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
  },
  run: async (payload, { ctx }) => {
    const domain = payload?.domain;
    const autoFetch = payload?.autoFetch !== false;
    const userContacts = payload?.contacts || [];

    console.log(`[Task ${ctx.run.id}]: Running Domain Analyzer for ${domain}...`);
    return await runDomainAnalyzer(domain, autoFetch, userContacts);
  },
});
