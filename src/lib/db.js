import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined!");
}

const client = neon(connectionString || "");

export async function sql(queryText, params = []) {
  if (params && params.length > 0) {
    return await client.query(queryText, params);
  }
  return await client.query(queryText);
}

// Helper to seed dynamic target contact lists matching standard states
function getInitialProspects(status, industry, domain) {
  const sector = industry.replace(/founders|executives|managers|startups/gi, "").trim() || "Tech";
  const secSlug = sector.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  if (domain && domain.toLowerCase() === "cloudly.co") {
    return [
      { email: "s.jenkins@aethercloud.io", businessDomain: "aethercloud.io", deliveryStatus: "Replied" },
      { email: "marcus.vance@cloudifysystems-error.com", businessDomain: "cloudifysystems-error.com", deliveryStatus: "Bounced" },
      { email: "dchen@cloudylydevops.com", businessDomain: "cloudylydevops.com", deliveryStatus: "Opened" },
      { email: "elena@vortexcloud.net", businessDomain: "vortexcloud.net", deliveryStatus: "Replied" },
      { email: "james@nimbusscale.com", businessDomain: "nimbusscale.com", deliveryStatus: "Sent" },
      { email: "t.miller@skylineops-error.com", businessDomain: "skylineops-error.com", deliveryStatus: "Bounced" },
      { email: "h.walter@stratuscompute-error.org", businessDomain: "stratuscompute-error.org", deliveryStatus: "Bounced" },
      { email: "r.patel@cumulusbrand.co", businessDomain: "cumulusbrand.co", deliveryStatus: "Replied" },
      { email: "a.novak@altuscloud.net", businessDomain: "altuscloud.net", deliveryStatus: "Opened" },
      { email: "k.sato@cirrusdev.io", businessDomain: "cirrusdev.io", deliveryStatus: "Sent" }
    ];
  }

  return [
    { email: `s.jenkins@aether${secSlug}.io`, businessDomain: `aether${secSlug}.io`, deliveryStatus: status === "Bounced" ? "Bounced" : status === "Replied" ? "Replied" : status === "Opened" ? "Opened" : "Sent" },
    { email: `dchen@${secSlug}ly.com`, businessDomain: `${secSlug}ly.com`, deliveryStatus: status === "Bounced" ? "Sent" : status === "Replied" ? "Opened" : status === "Opened" ? "Opened" : "Sent" },
    { email: `elena@vortex${secSlug}.net`, businessDomain: `vortex${secSlug}.net`, deliveryStatus: status === "Bounced" ? "Sent" : "Sent" }
  ];
}

// Helper to seed dynamic outbound tasks matching the user approved task schema requirements
function getInitialTasks(status, industry, domain, template, launchDate) {
  const calculateTaskDate = (launchDateStr, daysToAdd) => {
    try {
      const date = new Date(launchDateStr);
      date.setDate(date.getDate() + daysToAdd);
      return date.toISOString().split("T")[0];
    } catch (err) {
      return launchDateStr;
    }
  };

  const getPitchBody = (domain, industry, template) => {
    const pitches = {
      "Value Pitch": `Hi there,\n\nI noticed your product development in the ${industry} sector.\n\nI own the premium web address ${domain} and wanted to inquire if your team would be interested in acquiring it.\n\nSecuring ${domain} grants immediate brand recall, organic authority, and protects your positioning against competitors.\n\nWe facilitate transactions securely via Escrow.com or Dan.com.\n\nKind regards,\nDomain Broker Desk\nGenius Domain Names`,
      "Brief inquiry": `Hello,\n\nI am contacting you to see if you have any interest in acquiring ${domain} for your branding needs.\n\nWe are accepting serious offers. Please let me know if your domain manager is interested.\n\nWarmly,\nPortfolio Broker`,
      "Standard Proposal": `Dear Founders,\n\nYour work in the ${industry} space is impressive. I wanted to propose a strategic asset that could multiply your market credibility: ${domain}.\n\nA premium digital identity pays dividends by lowering acquisition costs and enhancing trust. Let me know if you would like to explore options.\n\nSincerely,\nGenius Domain Names`
    };
    return pitches[template] || pitches["Value Pitch"];
  };

  const subjectText = template === "Brief inquiry" 
    ? `Branding Assets: ${domain}`
    : template === "Standard Proposal"
    ? `Strategic domain proposal: ${domain}`
    : `Acquiring the premium brand identity ${domain}`;

  return [
    {
      task_id: "task-1",
      task_type: "FirstOutbound",
      task_status: status === "Bounced" ? "failed" : "completed",
      task_subject: subjectText,
      task_message: getPitchBody(domain, industry, template),
      schedule_date: launchDate,
      created_at: new Date(launchDate).toISOString()
    },
    {
      task_id: "task-2",
      task_type: "follow up",
      task_status: status === "Replied" ? "draft" : status === "Opened" ? "completed" : "scheduled",
      task_subject: `Re: ${subjectText}`,
      task_message: `Hi there,\n\nI wanted to follow up briefly regarding the premium domain ${domain}.\n\nIn your sector (${industry}), acquiring a highly brandable digital asset reduces client acquisition friction and prevents competitors from holding matching domains.\n\nAre you open to discussing potential acquisition structures?\n\nSincerely,\nPortfolio Manager\nGenius Domain Names`,
      schedule_date: calculateTaskDate(launchDate, 3),
      created_at: new Date(launchDate).toISOString()
    },
    {
      task_id: "task-3",
      task_type: "follow up",
      task_status: status === "Replied" ? "draft" : "scheduled",
      task_subject: `Re: ${subjectText}`,
      task_message: `Hello,\n\nI wanted to reach out one final time regarding ${domain}.\n\nWe facilitate all transactions securely via Escrow.com or Dan.com, and are open to reasonable offers or lease-to-own plans to fit your launch budget.\n\nIf you're not the correct contact, I'd appreciate it if you could forward this to your brand manager.\n\nBest regards,\nGenius Domain Names`,
      schedule_date: calculateTaskDate(launchDate, 7),
      created_at: new Date(launchDate).toISOString()
    }
  ];
}

export async function resetAndSeedOutbounds() {
  await sql("DELETE FROM outbounds");
  const defaultOutbounds = [
    { id: "out-1", domain: "quantumflow.ai", industry: "Machine Learning founders", template: "Value Pitch", date: "2026-07-06", status: "Opened", defaultSendTime: "09:00", selling_price: "15,000" },
    { id: "out-2", domain: "finverge.io", industry: "Digital Banking executives", template: "Standard Proposal", date: "2026-07-05", status: "Replied", defaultSendTime: "10:30", selling_price: "18,500" },
    { id: "out-3", domain: "payflow.app", industry: "Billing System managers", template: "Value Pitch", date: "2026-07-04", status: "Sent", defaultSendTime: "08:15", selling_price: "24,000" },
    { id: "out-4", domain: "solaria.net", industry: "Solar Energy startups", template: "Brief inquiry", date: "2026-07-02", status: "Bounced", defaultSendTime: "11:00", selling_price: "11,000" },
    { id: "out-5", domain: "cloudly.co", industry: "Cloud & Devops platforms", template: "Brief inquiry", date: "2026-07-03", status: "Replied", defaultSendTime: "09:45", selling_price: "13,500" }
  ];

  for (const o of defaultOutbounds) {
    const contacts = getInitialProspects(o.status, o.industry, o.domain);
    const tasks = getInitialTasks(o.status, o.industry, o.domain, o.template, o.date);
    
    await sql(
      `INSERT INTO outbounds (id, domain, industry, template, date, status, default_send_time, selling_price, contacts, tasks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [o.id, o.domain, o.industry, o.template, o.date, o.status, o.defaultSendTime, o.selling_price, JSON.stringify(contacts), JSON.stringify(tasks)]
    );
  }
}

export async function ensureTablesExistAndSeeded() {
  if (!connectionString) {
    console.error("Database connection missing. Auto-seeding aborted.");
    return;
  }

  try {
    console.log("Running database migrations & schema integrity checks...");

    // 1. Create domains table (supports purchase_price, type, city, niche)
    await sql(`
      CREATE TABLE IF NOT EXISTS domains (
        name VARCHAR(255) PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        tags TEXT[],
        badge VARCHAR(50),
        price VARCHAR(50) NOT NULL DEFAULT 'Inquire',
        purchase_price VARCHAR(50),
        type VARCHAR(100) DEFAULT 'Brandable Domain',
        city VARCHAR(100),
        niche VARCHAR(100)
      )
    `);

    // Ensure type column exists in domains for active database schemas
    await sql(`
      ALTER TABLE domains 
      ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'Brandable Domain'
    `);

    // Ensure city column exists in domains for active database schemas
    await sql(`
      ALTER TABLE domains 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100)
    `);

    // Ensure niche column exists in domains for active database schemas
    await sql(`
      ALTER TABLE domains 
      ADD COLUMN IF NOT EXISTS niche VARCHAR(100)
    `);

    // 2. Create outbounds table (supports selling_price, without outbound-level subject)
    await sql(`
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
      )
    `);

    // Ensure persona column exists in outbounds for active database schemas
    await sql(`
      ALTER TABLE outbounds 
      ADD COLUMN IF NOT EXISTS persona JSONB DEFAULT '{}'::jsonb
    `);

    // 3. Create inquiries table
    await sql(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        offer_price VARCHAR(50),
        message TEXT,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'New'
      )
    `);

    // 4. Create personas table
    await sql(`
      CREATE TABLE IF NOT EXISTS personas (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        tone VARCHAR(50) NOT NULL,
        image_url VARCHAR(550),
        gender VARCHAR(50)
      )
    `);

    // Ensure image_url column exists in personas for active schemas
    await sql(`
      ALTER TABLE personas 
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(550)
    `);

    // Ensure gender column exists in personas for active schemas
    await sql(`
      ALTER TABLE personas 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50)
    `);

    console.log("Database schema integrity verification completed successfully!");
  } catch (err) {
    console.error("Error during table existence verification and schema integrity check:", err);
  }
}
