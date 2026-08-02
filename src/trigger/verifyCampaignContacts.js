import { task } from "@trigger.dev/sdk/v3";
import { checkEmail } from "../lib/verifyEmail.js";
import { sql } from "../lib/db.js";

/**
 * Orchestrator function to verify a list of campaign contacts and categorize them
 * into valid, risky, and invalid lists.
 */
export async function runVerifyCampaignContacts(domain, contactsInput = null) {
  console.log(`[Email Verifier]: Starting verification task for domain "${domain}"...`);

  // 1. Fetch Outbound Campaign & merge contacts from DB + contactsInput
  let campaign = null;
  const contactsMap = new Map();

  if (domain) {
    const res = await sql("SELECT * FROM outbounds WHERE LOWER(domain) = LOWER($1) LIMIT 1", [domain.toLowerCase().trim()]);
    const rows = res.rows || res || [];
    if (rows.length > 0) {
      campaign = rows[0];
      const dbContacts = Array.isArray(campaign.contacts)
        ? campaign.contacts
        : typeof campaign.contacts === "string"
        ? JSON.parse(campaign.contacts)
        : [];
      
      for (const item of dbContacts) {
        const itemEmail = typeof item === "string" ? item : item?.email;
        if (itemEmail && itemEmail.includes("@")) {
          contactsMap.set(itemEmail.toLowerCase().trim(), typeof item === "string" ? { email: item.trim() } : item);
        }
      }
    }
  }

  if (Array.isArray(contactsInput)) {
    for (const item of contactsInput) {
      const itemEmail = typeof item === "string" ? item : item?.email;
      if (itemEmail && itemEmail.includes("@")) {
        const key = itemEmail.toLowerCase().trim();
        const existing = contactsMap.get(key) || {};
        contactsMap.set(key, { ...existing, ...(typeof item === "string" ? { email: item.trim() } : item) });
      }
    }
  }

  const contacts = Array.from(contactsMap.values());

  if (contacts.length === 0) {
    console.log(`[Email Verifier]: No valid contacts found for verification.`);
    return {
      success: true,
      domain,
      valid: [],
      risky: [],
      invalid: [],
      total: 0
    };
  }

  const validContacts = [];
  const riskyContacts = [];
  const invalidContacts = [];
  const verifiedContacts = [];

  // 2. Perform verification for each contact using checkEmail
  for (const contact of contacts) {
    const targetEmail = (typeof contact === "string" ? contact : (contact?.email || "")).trim();
    
    if (!targetEmail || !targetEmail.includes("@")) {
      console.warn("[Email Verifier]: Skipping contact with invalid email address:", contact);
      continue;
    }

    const businessDomain = typeof contact === "string"
      ? targetEmail.split("@")[1] || "company.com"
      : (contact.businessDomain || targetEmail.split("@")[1] || "company.com");
    
    console.log(`[Email Verifier]: Verifying target email "${targetEmail}"...`);

    let checkResult = null;
    try {
      checkResult = await checkEmail(targetEmail);
    } catch (err) {
      console.error(`[Email Verifier]: Error checking ${targetEmail}:`, err);
      checkResult = { verdict: "risky", error: err.message };
    }

    const verdict = checkResult?.verdict || "risky";
    let verificationStatus = "risky";

    if (verdict === "valid") {
      verificationStatus = "valid";
    } else if (verdict === "invalid") {
      verificationStatus = "invalid";
    } else {
      verificationStatus = "risky";
    }

    const updatedContact = {
      ...(typeof contact === "object" ? contact : {}),
      email: targetEmail,
      businessDomain,
      ...(verificationStatus === "invalid" ? { deliveryStatus: "Bounced" } : contact?.deliveryStatus ? { deliveryStatus: contact.deliveryStatus } : {}),
      verificationStatus,
      verificationResult: {
        syntaxCheck: checkResult.syntaxCheck ?? null,
        disposableCheck: checkResult.disposableCheck ?? null,
        mxCheck: checkResult.mxCheck ?? null,
        dnsCheck: checkResult.dnsCheck ?? null,
        roleAccountCheck: checkResult.roleAccountCheck ?? null,
        knownBadDomainCheck: checkResult.knownBadDomainCheck ?? null,
        suppressionCheck: checkResult.suppressionCheck ?? null,
        bounceCheck: checkResult.bounceCheck ?? null,
        verdict: checkResult.verdict ?? "risky"
      }
    };

    verifiedContacts.push(updatedContact);

    if (verificationStatus === "valid") {
      validContacts.push(updatedContact);
    } else if (verificationStatus === "risky") {
      riskyContacts.push(updatedContact);
    } else {
      invalidContacts.push(updatedContact);
    }
  }

  // 3. Save merged & verified contacts back to Neon DB if domain is provided
  if (domain) {
    try {
      const latestRes = await sql("SELECT contacts FROM outbounds WHERE LOWER(domain) = LOWER($1) LIMIT 1", [domain.toLowerCase().trim()]);
      const latestRows = latestRes.rows || latestRes || [];
      if (latestRows.length > 0) {
        const latestDbContacts = Array.isArray(latestRows[0].contacts)
          ? latestRows[0].contacts
          : typeof latestRows[0].contacts === "string"
          ? JSON.parse(latestRows[0].contacts)
          : [];
        
        const saveMap = new Map();
        for (const item of latestDbContacts) {
          const e = typeof item === "string" ? item : item?.email;
          if (e) saveMap.set(e.toLowerCase().trim(), typeof item === "string" ? { email: e.trim() } : item);
        }
        for (const item of verifiedContacts) {
          if (item?.email) saveMap.set(item.email.toLowerCase().trim(), item);
        }
        const finalSavedList = Array.from(saveMap.values());
        
        await sql(
          `UPDATE outbounds SET contacts = $1 WHERE LOWER(domain) = LOWER($2)`,
          [JSON.stringify(finalSavedList), domain.toLowerCase().trim()]
        );
        console.log(`[Email Verifier]: Successfully persisted ${finalSavedList.length} verified contacts to database for "${domain}".`);
      }
    } catch (dbErr) {
      console.error("[Email Verifier]: Error saving verified contacts to database:", dbErr.message);
    }
  }

  console.log(`[Email Verifier]: Verification complete. Valid: ${validContacts.length}, Risky: ${riskyContacts.length}, Invalid: ${invalidContacts.length}`);

  return {
    success: true,
    domain,
    verifiedContacts,
    valid: validContacts,
    risky: riskyContacts,
    invalid: invalidContacts,
    total: verifiedContacts.length
  };
}

// 4. Trigger.dev Task Export
export const verifyCampaignContactsTask = task({
  id: "verify-campaign-contacts",
  maxDuration: 600, // 10 minutes timeout for batch email verification
  run: async (payload, { ctx }) => {
    const domain = payload?.domain;
    const contacts = payload?.contacts;

    console.log(`[Task ${ctx.run.id}]: Running verify-campaign-contacts for domain ${domain}...`);
    return await runVerifyCampaignContacts(domain, contacts);
  }
});
