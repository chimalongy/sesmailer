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
4. "scrapePrompt": A structured scraping prompt formatted EXACTLY like: "You are an expert lead generation and market research agent. Search Google and Google Maps to find local \${niche} and \${service} providing these services in \${location}. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found."

Examples:
- teethwhitening-sandiego.com -> location: "San Diego", niche: "teeth whitening clinics", service: "teeth whitening", scrapePrompt: "You are an expert lead generation and market research agent. Search Google and Google Maps to find local teeth whitening clinics and teeth whitening providing these services in San Diego. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found."
- realestateagentlongisland.com -> location: "Long Island", niche: "real estate agents", service: "real estate services", scrapePrompt: "You are an expert lead generation and market research agent. Search Google and Google Maps to find local real estate agents and real estate services providing these services in Long Island. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found."

You MUST return a clean, valid JSON object with NO extra text or markdown formatting:
{
  "location": "Long Island",
  "niche": "real estate agents",
  "service": "real estate services",
  "scrapePrompt": "You are an expert lead generation and market research agent. Search Google and Google Maps to find local real estate agents and real estate services providing these services in Long Island. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found."
}`;

  const userPrompt = `Analyze the domain name "${domainName}" and extract the location, niche, service, and generate the scrapePrompt.`;

  return { systemPrompt, userPrompt };
}
