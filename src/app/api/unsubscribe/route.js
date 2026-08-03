import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function processUnsubscribe(email, domain) {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email address is required" };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanDomain = domain ? domain.toLowerCase().trim() : null;

  // 1. Fetch campaigns containing this email (or matching domain if specified)
  let query = "SELECT * FROM outbounds";
  let params = [];
  if (cleanDomain) {
    query += " WHERE LOWER(domain) = LOWER($1)";
    params.push(cleanDomain);
  }

  const res = await sql(query, params);
  const campaigns = res.rows || res || [];

  let totalUpdated = 0;

  for (const campaign of campaigns) {
    let contacts = Array.isArray(campaign.contacts)
      ? campaign.contacts
      : typeof campaign.contacts === "string"
      ? JSON.parse(campaign.contacts)
      : [];

    let updated = false;

    contacts = contacts.map((c) => {
      const contactEmail = (typeof c === "string" ? c : c?.email || "").toLowerCase().trim();
      if (contactEmail === cleanEmail) {
        updated = true;
        totalUpdated++;
        return typeof c === "string"
          ? { email: c, verificationStatus: "unsubscribed", deliveryStatus: "Unsubscribed" }
          : { ...c, verificationStatus: "unsubscribed", deliveryStatus: "Unsubscribed" };
      }
      return c;
    });

    if (updated) {
      await sql(
        `UPDATE outbounds SET contacts = $1 WHERE LOWER(domain) = LOWER($2)`,
        [JSON.stringify(contacts), campaign.domain.toLowerCase().trim()]
      );
    }
  }

  console.log(`[Unsubscribe API]: Marked "${cleanEmail}" as unsubscribed across ${totalUpdated} campaign contact record(s).`);

  return {
    success: true,
    email: cleanEmail,
    domain: cleanDomain,
    totalUpdated
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const domain = searchParams.get("domain");

    const result = await processUnsubscribe(email, domain);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Unsubscribe API]: GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to process unsubscribe request" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    
    const email = body.email || searchParams.get("email");
    const domain = body.domain || searchParams.get("domain");

    const result = await processUnsubscribe(email, domain);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Unsubscribe API]: POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to process unsubscribe request" }, { status: 500 });
  }
}
