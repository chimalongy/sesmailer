import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { runVerifyCampaignContacts } from "@/trigger/verifyCampaignContacts";

export async function GET(request, { params }) {
  try {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const data = await sql(
      `SELECT o.*, d.type AS domain_type, d.city AS domain_city, d.niche AS domain_niche
       FROM outbounds o
       LEFT JOIN domains d ON LOWER(o.domain) = LOWER(d.name)
       WHERE LOWER(o.domain) = LOWER($1)
       LIMIT 1`,
      [decodedDomain]
    );
    
    if (data.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const row = data[0];
    const mapped = {
      id: row.id,
      domain: row.domain,
      industry: row.industry,
      template: row.template,
      date: row.date,
      status: row.status,
      defaultSendTime: row.default_send_time,
      selling_price: row.selling_price,
      contacts: row.contacts || [],
      tasks: row.tasks || [],
      persona: row.persona || {},
      domainType: row.domain_type || "Brandable Domain",
      city: row.domain_city || "",
      niche: row.domain_niche || ""
    };
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const body = await request.json();
    
    const { contacts, tasks, status, defaultSendTime, selling_price, persona } = body;

    const existing = await sql("SELECT * FROM outbounds WHERE LOWER(domain) = LOWER($1) LIMIT 1", [decodedDomain]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const row = existing[0];
    const finalContacts = contacts !== undefined ? JSON.stringify(contacts) : JSON.stringify(row.contacts || []);
    const finalTasks = tasks !== undefined ? JSON.stringify(tasks) : JSON.stringify(row.tasks || []);
    const finalStatus = status !== undefined ? status : row.status;
    const finalSendTime = defaultSendTime !== undefined ? defaultSendTime : row.default_send_time;
    const finalSellingPrice = selling_price !== undefined ? selling_price : row.selling_price;
    const finalPersona = persona !== undefined ? JSON.stringify(persona) : JSON.stringify(row.persona || {});

    await sql(
      `UPDATE outbounds
       SET contacts = $1, tasks = $2, status = $3, default_send_time = $4, selling_price = $5, persona = $6
       WHERE LOWER(domain) = LOWER($7)`,
      [finalContacts, finalTasks, finalStatus, finalSendTime, finalSellingPrice, finalPersona, decodedDomain]
    );

    // If contacts were updated, trigger email verification in background
    if (contacts && Array.isArray(contacts)) {
      runVerifyCampaignContacts(decodedDomain, contacts).catch((err) => {
        console.error("Background contact verification error on PUT:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    
    const existing = await sql("SELECT 1 FROM outbounds WHERE LOWER(domain) = LOWER($1) LIMIT 1", [decodedDomain]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await sql("DELETE FROM outbounds WHERE LOWER(domain) = LOWER($1)", [decodedDomain]);
    return NextResponse.json({ success: true, message: `Successfully deleted campaign for ${decodedDomain}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
