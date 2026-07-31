-- ===========================================================================
-- GENIUS DOMAIN NAMES - POSTGRESQL DATABASE SCHEMA
-- ===========================================================================

-- 1. Premium Domains Inventory Table
-- Tracks assets available for purchase, acquisition metrics, and showcase categories.
CREATE TABLE IF NOT EXISTS domains (
    name VARCHAR(255) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    tags TEXT[],
    badge VARCHAR(50),
    price VARCHAR(50) NOT NULL DEFAULT 'Inquire',
    purchase_price VARCHAR(50),
    location VARCHAR(255),
    niche VARCHAR(255),
    service VARCHAR(255),
    scrape_prompt TEXT
);

-- 2. Cold Outreach Campaigns Table
-- Manages sequences, targets list, default times, and target industry metrics.
CREATE TABLE IF NOT EXISTS outbounds (
    id VARCHAR(50) PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    industry VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL,
    date VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL,
    default_send_time VARCHAR(10) DEFAULT '09:00',
    selling_price VARCHAR(50),
    contacts JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    persona JSONB DEFAULT '{}'::jsonb
);


-- 4. Outreach Personas Table
-- Manages global sender personas, names, titles, email addresses, and messaging tones.
CREATE TABLE IF NOT EXISTS personas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tone VARCHAR(50) NOT NULL,
    image_url VARCHAR(550),
    gender VARCHAR(50),
    reply_to_email VARCHAR(255),
    company_address VARCHAR(255),
    company_address_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(50),
    country VARCHAR(100),
    sendgrid_sender_id VARCHAR(100),
    sendgrid_verified BOOLEAN DEFAULT FALSE
);

-- 5. Single Sent Emails Table
-- Stores individual single emails sent via Compose Single Email desk and tracked replies.
CREATE TABLE IF NOT EXISTS single_emails (
    id VARCHAR(50) PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    from_email VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Sent',
    message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    messages JSONB DEFAULT '[]'::jsonb
);

-- 6. LLM API Providers Table
-- Manages AI model provider credentials and account emails.
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

-- 7. Firecrawl API Keys Table
-- Tracks Firecrawl scraping API keys, account email, and daily 5-request usage cap.
CREATE TABLE IF NOT EXISTS firecrawl_apis (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    daily_usage_count INT DEFAULT 0,
    last_used_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

