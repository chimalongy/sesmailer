/**
 * Builds system and user prompts to analyze a domain name and extract its location, niche, service,
 * and construct the AI scraping agent prompt directly.
 * 
 * @param {string} domainName - e.g. "realestateagentlongisland.com" or "teethwhitening-sandiego.com"
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildDomainNicheLocationPrompt(domainName) {
  const systemPrompt = `You are an expert market intelligence and domain analysis assistant.
Your job is to analyze a given domain name and extract:
1. "location": The target geographic location or city/region implied by the domain name (e.g. "Long Island", "San Diego", "Miami", "Orange County"). If no location is implied, default to "United States".
2. "niche": The business vertical or industry (e.g. "real estate agents", "teeth whitening clinics", "cosmetic dentists").
3. "service": Specific services offered (e.g. "real estate services", "teeth whitening", "dentists") or service implied in the domain.
4. "scrapePrompt": A structured scraping prompt formatted EXACTLY like: "Find local \${niche} and \${service} providing these services in \${location}. Extract their business names and direct website URLs."

Examples:
- teethwhitening-sandiego.com -> location: "San Diego", niche: "teeth whitening clinics", service: "teeth whitening", scrapePrompt: "Find local teeth whitening clinics and teeth whitening providing these services in San Diego. Extract their business names and direct website URLs."
- realestateagentlongisland.com -> location: "Long Island", niche: "real estate agents", service: "real estate services", scrapePrompt: "Find local real estate agents and real estate services providing these services in Long Island. Extract their business names and direct website URLs."

You MUST return a clean, valid JSON object with NO extra text or markdown formatting:
{
  "location": "Long Island",
  "niche": "real estate agents",
  "service": "real estate services",
  "scrapePrompt": "Find local real estate agents and real estate services providing these services in Long Island. Extract their business names and direct website URLs."
}`;

  const userPrompt = `Analyze the domain name "${domainName}" and extract the location, niche, service, and generate the scrapePrompt.`;

  return { systemPrompt, userPrompt };
}
