import { sql } from "@/lib/db";

/**
 * Ensures the llm_apis and image_apis tables exist in Neon Postgres
 */
export async function ensureLlmTablesExist() {
  try {
    await sql(`
      CREATE TABLE IF NOT EXISTS llm_apis (
        id SERIAL PRIMARY KEY,
        llm_provider VARCHAR(50) NOT NULL,
        llm_url TEXT,
        llm_api TEXT,
        model_name VARCHAR(100),
        email TEXT DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE llm_apis ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS image_apis (
        id SERIAL PRIMARY KEY,
        source VARCHAR(100) NOT NULL,
        value TEXT NOT NULL,
        usage_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS firecrawl_apis (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        daily_usage_count INT DEFAULT 0,
        last_used_date DATE DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("[LLM DB]: Table initialization warning:", err.message);
  }
}

/**
 * Retrieves LLM API provider configurations from Neon Postgres DB
 * @returns {Promise<Array<object>>}
 */
export async function getLLMAPIs() {
  await ensureLlmTablesExist();

  try {
    const data = await sql(
      `SELECT * FROM llm_apis WHERE is_active = TRUE ORDER BY id ASC`
    );

    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.error("[LLM DB]: Error fetching LLM API keys from Neon Postgres:", error.message);
  }

  // Fallback API configuration when database table is empty or unseeded
  const fallbackApis = [];

  if (process.env.GROQ_API_KEY) {
    fallbackApis.push({
      id: "env-groq",
      llm_provider: "groq",
      llm_url: "https://api.groq.com/openai/v1",
      llm_api: process.env.GROQ_API_KEY,
      model_name: "llama-3.3-70b-versatile"
    });
  }

  if (process.env.OPENAI_API_KEY) {
    fallbackApis.push({
      id: "env-openai",
      llm_provider: "openai",
      llm_url: "https://api.openai.com/v1",
      llm_api: process.env.OPENAI_API_KEY,
      model_name: "gpt-4o-mini"
    });
  }

  if (process.env.BASE_TEN_API_KEY && process.env.BASE_TEN_BASE_URL) {
    fallbackApis.push({
      id: "env-baseten",
      llm_provider: "baseten",
      llm_url: process.env.BASE_TEN_BASE_URL,
      llm_api: process.env.BASE_TEN_API_KEY,
      model_name: "moonshotai/Kimi-K2.6"
    });
  }

  return fallbackApis;
}

/**
 * Retrieves image generation API entries from Neon Postgres DB
 * @param {string} targetkeys
 * @returns {Promise<Array<object>>}
 */
export async function getImageGenerationUrls(targetkeys) {
  await ensureLlmTablesExist();

  try {
    const data = await sql(
      `SELECT id, source, value, usage_count FROM image_apis WHERE source = $1`,
      [targetkeys]
    );
    return data || [];
  } catch (error) {
    console.error("[LLM DB]: Error fetching image API keys from Neon Postgres:", error.message);
    return [];
  }
}
/**
 * Retrieves an available Firecrawl API key from Neon DB, enforcing max 5 requests/day per key.
 * Automatically resets daily usage counts if last_used_date is before today.
 *
 * @returns {Promise<{ apiKey: string, email?: string, id?: number } | null>}
 */
export async function getAvailableFirecrawlApiKey() {
  await ensureLlmTablesExist();

  try {
    // 1. Reset daily usage counts for keys last used on prior days
    await sql(`
      UPDATE firecrawl_apis 
      SET daily_usage_count = 0, last_used_date = CURRENT_DATE 
      WHERE last_used_date < CURRENT_DATE
    `);

    // 2. Select active key with daily_usage_count < 5
    const rows = await sql(`
      SELECT * FROM firecrawl_apis 
      WHERE is_active = TRUE AND daily_usage_count < 5 
      ORDER BY daily_usage_count ASC, id ASC 
      LIMIT 1
    `);

    if (rows && rows.length > 0) {
      const selectedKey = rows[0];
      const newUsageCount = (selectedKey.daily_usage_count || 0) + 1;

      // 3. Increment daily usage count and update last_used_date
      await sql(`
        UPDATE firecrawl_apis 
        SET daily_usage_count = $1, last_used_date = CURRENT_DATE 
        WHERE id = $2
      `, [newUsageCount, selectedKey.id]);

      console.log(`[Firecrawl API Pool]: Using key id=${selectedKey.id} (${selectedKey.email}). Usage today: ${newUsageCount}/5.`);

      return {
        id: selectedKey.id,
        apiKey: selectedKey.api_key,
        email: selectedKey.email,
        dailyUsageCount: newUsageCount
      };
    } else {
      console.warn("[Firecrawl API Pool]: All registered Firecrawl API keys in Neon DB have reached the 5-request daily cap for today.");
    }
  } catch (err) {
    console.error("[Firecrawl API Pool]: Error acquiring Firecrawl API key from Neon DB:", err.message);
  }

  // Fallback to environment variable if DB pool has no available keys
  const envKey = process.env.FIRECRAWL_API_KEY || "fc-12e9aa9a21f8473e93b860c1fcbd3bb1";
  if (envKey) {
    return { apiKey: envKey, email: "env-fallback@firecrawl" };
  }

  return null;
}
