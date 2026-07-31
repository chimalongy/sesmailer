import { task } from "@trigger.dev/sdk/v3";
import { Firecrawl } from "firecrawl";
import { z } from "zod";
import { analyzeDomainForScraping } from "@/lib/Ai/LLM-central";

// 1. Define the structure of the data you want the AI to extract
const businessSchema = z.object({
    businesses: z.array(
        z.object({
            name: z.string().describe("The formal name of the teeth whitening business or dental clinic."),
            website_url: z.string().url().nullable().describe("The direct URL to the business website."),
            phone: z.string().nullable().describe("Contact phone number."),
            rating: z.number().nullable().describe("Average rating if available.")
        })
    )
});

// Helper function to execute scrape logic directly using Firecrawl
export async function runScrape(location = "San Diego", niche = "teeth whitening clinics", domainName = null) {
    const apiKey = process.env.FIRECRAWL_API_KEY || "fc-12e9aa9a21f8473e93b860c1fcbd3bb1";
    if (!apiKey) {
        throw new Error("FIRECRAWL_API_KEY is missing from environment variables.");
    }

    let agentPrompt = `Find local ${niche} and dentists providing these services in ${location}. Extract their business names and direct website URLs.`;
    if (domainName) {
        const domainAnalysis = await analyzeDomainForScraping(domainName);
        agentPrompt = domainAnalysis.scrapePrompt;
    }

    const app = new Firecrawl({ apiKey });

    // Execute the Firecrawl Agent
    const response = await app.agent({
        prompt: agentPrompt,
        schema: businessSchema
    });

    if (!response?.success) {
        throw new Error(`Firecrawl Agent failed: ${response?.error || "Unknown error"}`);
    }

    const businesses = response.data?.businesses ?? [];

    return {
        success: true,
        scrapedAt: new Date().toISOString(),
        location,
        niche,
        resultsCount: businesses.length,
        data: businesses
    };
}

// 2. Define the Trigger.dev background task
export const scrapeTeethWhiteningTask = task({
    id: "scrape-teeth-whitening",
    maxDuration: 300, // 5 minutes timeout to allow the AI agent to search and scrape
    retry: {
        maxAttempts: 3,
        minTimeoutInMs: 5000,
    },
    run: async (payload, { ctx }) => {
        const location = payload?.location || "San Diego";
        const niche = payload?.niche || "teeth whitening clinics";

        console.log(`[Task ${ctx.run.id}]: Starting autonomous scrape for ${niche} in ${location}...`);

        try {
            const results = await runScrape(location, niche);
            console.log(`[Task ${ctx.run.id}]: Successfully extracted ${results.resultsCount} records.`);
            return results;
        } catch (error) {
            console.error(`[Task ${ctx.run.id}]: Operational error occurred during execution.`, error);
            throw error; // Re-throw so Trigger.dev registers the failure/retry logic
        }
    },
});