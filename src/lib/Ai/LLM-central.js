import OpenAI from "openai";
import { getLLMAPIs } from "./getapis";
import { buildDomainNicheLocationPrompt } from "./prompts";
import { sql } from "@/lib/db";

/**
 * Core LLM gateway — ALL AI requests funnel through this function.
 * Reads API keys and configurations directly from Neon Postgres DB via getLLMAPIs().
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} options
 * @returns {Promise<object>} Parsed JSON or structured response returned by the model
 */
export async function callLLM(systemPrompt, userPrompt, options = {}) {
  const llm_apis = await getLLMAPIs();

  if (!llm_apis || llm_apis.length === 0) {
    throw new Error(
      "No active LLM APIs found in Neon Postgres database or environment variables. Please insert API keys into the 'llm_apis' table."
    );
  }

  let apisToTry = llm_apis;
  if (options.provider) {
    apisToTry = llm_apis.filter((api) => api.llm_provider?.toLowerCase() === options.provider.toLowerCase());
    if (apisToTry.length === 0) apisToTry = llm_apis;
  }

  let lastError = null;

  for (const api of apisToTry) {
    try {
      console.log(`[LLM Central]: Invoking provider "${api.llm_provider}" (id: ${api.id})`);

      const provider = api.llm_provider?.toLowerCase();

      if (provider === "groq") {
        return await callGroq(api, systemPrompt, userPrompt, options);
      } else if (provider === "openai") {
        return await callOpenAI(api, systemPrompt, userPrompt, options);
      } else if (provider === "baseten") {
        return await callBaseten(api, systemPrompt, userPrompt, options);
      } else if (provider === "cloudflare" || provider === "cloudfare") {
        return await callCloudflare(api, systemPrompt, userPrompt, options);
      } else {
        // Generic OpenAI-compatible fallback
        return await callOpenAI(api, systemPrompt, userPrompt, options);
      }
    } catch (err) {
      console.error(`[LLM Central]: Provider "${api.llm_provider}" failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All LLM API providers failed. Last error: ${lastError?.message}`);
}

/**
 * Call Groq API
 */
async function callGroq(api, systemPrompt, userPrompt, options = {}) {
  let baseURL = api.llm_url || "https://api.groq.com/openai/v1";
  if (baseURL.endsWith("/chat/completions")) {
    baseURL = baseURL.replace(/\/chat\/completions\/?$/, "");
  }

  const client = new OpenAI({
    apiKey: api.llm_api,
    baseURL: baseURL,
  });

  const response = await client.chat.completions.create({
    model: api.model_name || "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature ?? 0.3,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  return parseJsonResponse(raw);
}

/**
 * Call OpenAI API
 */
async function callOpenAI(api, systemPrompt, userPrompt, options = {}) {
  let baseURL = api.llm_url || "https://api.openai.com/v1";
  if (baseURL.endsWith("/chat/completions")) {
    baseURL = baseURL.replace(/\/chat\/completions\/?$/, "");
  }

  const client = new OpenAI({
    apiKey: api.llm_api,
    baseURL: baseURL,
  });

  const response = await client.chat.completions.create({
    model: api.model_name || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature ?? 0.3,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  return parseJsonResponse(raw);
}

/**
 * Call BaseTen API
 */
async function callBaseten(api, systemPrompt, userPrompt, options = {}) {
  const client = new OpenAI({
    apiKey: api.llm_api,
    baseURL: api.llm_url,
  });

  const response = await client.chat.completions.create({
    model: api.model_name || "moonshotai/Kimi-K2.6",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature ?? 0.3,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  return parseJsonResponse(raw);
}

/**
 * Call Cloudflare API
 */
async function callCloudflare(api, systemPrompt, userPrompt) {
  const response = await fetch(api.llm_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api.llm_api}`,
    },
    body: JSON.stringify({
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare LLM request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const raw = data.reply || data.choices?.[0]?.message?.content || "";
  return parseJsonResponse(raw);
}

/**
 * Utility to safely parse JSON response strings from LLM models
 */
function parseJsonResponse(rawText) {
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[LLM Central]: Failed to parse raw JSON output:", cleaned);
    return { raw: cleaned };
  }
}

/**
 * High-level AI function: Analyzes a domain name to extract location and niche/service,
 * and generates the AI scraping agent prompt.
 *
 * Example Output:
 * {
 *   location: "Long Island",
 *   niche: "real estate agents",
 *   service: "real estate services",
 *   scrapePrompt: "Find local real estate agents and real estate services providing these services in Long Island. Extract their business names and direct website URLs."
 * }
 *
 * @param {string} domainName - e.g. "realestateagentlongisland.com"
 * @returns {Promise<{ location: string, niche: string, service: string, scrapePrompt: string }>}
 */
export async function analyzeDomainForScraping(domainName) {
  const normalizedDomain = domainName.toLowerCase().replace(/^https?:\/\//, "").replace(/www\./, "").replace(/\/.*$/, "").trim();
  const { systemPrompt, userPrompt } = buildDomainNicheLocationPrompt(normalizedDomain);

  let result = null;
  try {
    result = await callLLM(systemPrompt, userPrompt);
  } catch (err) {
    console.warn(`[LLM Central]: AI analysis fallback for "${normalizedDomain}":`, err.message);

    // Heuristic fallback parser if LLM APIs are offline
    const cleanDomain = normalizedDomain.replace(/\.[a-z]+$/, "");
    const parts = cleanDomain.split(/[-_.]/);

    result = {
      location: parts.length > 1 ? parts[parts.length - 1] : "United States",
      niche: parts[0] || "businesses",
      service: parts[0] || "services",
      scrapePrompt: `You are an expert lead generation and market research agent. Search Google and Google Maps to find local ${parts[0] || "businesses"} and ${parts[0] || "services"} providing these services in ${parts.length > 1 ? parts[parts.length - 1] : "United States"}. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found.`
    };
  }

  const location = result?.location || "United States";
  const niche = result?.niche || "businesses";
  const service = result?.service || niche;
  const scrapePrompt = result?.scrapePrompt || `You are an expert lead generation and market research agent. Search Google and Google Maps to find local ${niche} and ${service} providing these services in ${location}. Extract their business names, direct website URLs, business owner's name, and business owner's email address. If the business owner's email is not directly available on Google or their website, check the business Facebook page to find their official contact email address. The business website URL is COMPULSORY and must exist for every record; other fields may be left empty if not found.`;

  // Persist / Save extracted metadata directly to the portfolio (domains) table in Neon Postgres
  try {
    await sql(
      `UPDATE domains 
       SET location = $1, niche = $2, service = $3, scrape_prompt = $4 
       WHERE LOWER(name) = LOWER($5)`,
      [location, niche, service, scrapePrompt, normalizedDomain]
    );
    console.log(`[LLM Central]: Successfully persisted AI domain analysis for "${normalizedDomain}" to Neon Postgres.`);
  } catch (dbErr) {
    console.error(`[LLM Central]: Failed to update portfolio table for "${normalizedDomain}":`, dbErr.message);
  }

  return {
    location,
    niche,
    service,
    scrapePrompt
  };
}
