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
    purchase_price VARCHAR(50)
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

-- 3. Customer Buyer Inquiries Table
-- Stores customer offer prices, lead status, messages, and contact details.
CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    offer_price VARCHAR(50),
    message TEXT,
    date VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'New'
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
    gender VARCHAR(50)
);
