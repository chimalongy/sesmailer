import { task } from "@trigger.dev/sdk/v3";
import { checkEmail } from "../lib/verifyEmail.js";
import { sql } from "../lib/db.js";

/**
 * Orchestrator function to verify a list of campaign contacts and categorize them
 * into valid, risky, and invalid lists.
 */
export async function runVerifyCampaignContacts(domain, contactsInput = null) {
  console.log(`[Email Verifier]: Starting verification task for domain "${domain}"...`);

  // 1. Fetch Outbound Campaign from Neon DB if domain provided
  let campaign = null;
  let contacts = contactsInput || [];

  if (domain) {
    const res = await sql("SELECT * FROM outbounds WHERE LOWER(domain) = LOWER($1) LIMIT 1", [domain.toLowerCase().trim()]);
    const rows = res.rows || res || [];
    if (rows.length > 0) {
      campaign = rows[0];
      if (!contactsInput || contactsInput.length === 0) {
        contacts = Array.isArray(campaign.contacts)
          ? campaign.contacts
          : typeof campaign.contacts === "string"
          ? JSON.parse(campaign.contacts)
          : [];
      }
    }
  }

  if (contacts.length === 0) {
    console.log(`[Email Verifier]: No contacts found for verification.`);
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
    const email = typeof contact === "string" ? contact : contact.email;
    const businessDomain = typeof contact === "string" ? email.split("@")[1] || "company.com" : (contact.businessDomain || email.split("@")[1] || "company.com");
    
    console.log(`[Email Verifier]: Verifying ${email}...`);

    let checkResult = null;
    try {
      checkResult = await checkEmail(email);
    } catch (err) {
      console.error(`[Email Verifier]: Error checking ${email}:`, err);
      checkResult = { verdict: "risky", error: err.message };
    }

    const verdict = checkResult?.verdict || "risky";
    let verificationStatus = "risky";

    if (verdict === "valid") {
      verificationStatus = "valid";
    } else if (verdict === "invalid") {
      verificationStatus = "invalid";
    } else {
      // 'risky' or 'unknown'
      verificationStatus = "risky";
    }

    const updatedContact = {
      ...(typeof contact === "object" ? contact : {}),
      email,
      businessDomain,
      deliveryStatus: verificationStatus === "invalid" ? "Bounced" : (contact.deliveryStatus || "Sent"),
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

  // 3. Save categorized contacts back to Neon DB if campaign exists
  if (domain && campaign) {
    await sql(
      `UPDATE outbounds SET contacts = $1 WHERE LOWER(domain) = LOWER($2)`,
      [JSON.stringify(verifiedContacts), domain.toLowerCase().trim()]
    );
    console.log(`[Email Verifier]: Saved verified contacts to database for "${domain}".`);
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
