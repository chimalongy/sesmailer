import { task } from "@trigger.dev/sdk/v3";
import { Firecrawl } from "firecrawl";
import { z } from "zod";
import { analyzeDomainForScraping } from "@/lib/Ai/LLM-central";

// 1. Define the structure of the data you want the AI to extract
const businessSchema = z.object({
    businesses: z.array(
        z.object({
            website_url: z.string().describe("COMPULSORY: Direct website URL of the business. Must exist."),
            name: z.string().nullable().describe("The formal name of the business or dental clinic."),
            owner_name: z.string().nullable().describe("Business owner or decision maker's full name if found."),
            owner_email: z.string().nullable().describe("Business owner or direct contact email address if found."),
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

    let agentPrompt = `You are an expert in lead generation and market research. Search Google and Google Maps to find local ${niche} and dentists providing these services in ${location}. Extract their business names, direct website URLs, business owner's name, and business owner's email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found.`;
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