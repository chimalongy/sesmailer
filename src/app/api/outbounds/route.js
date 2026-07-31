import { NextResponse } from "next/server";
import { sql, ensureTablesExistAndSeeded, resetAndSeedOutbounds } from "@/lib/db";
import { runDomainAnalyzer } from "@/trigger/domainAnalyzer";
import { tasks } from "@trigger.dev/sdk/v3";

export async function GET() {
  await ensureTablesExistAndSeeded();
  try {
    const data = await sql("SELECT * FROM outbounds ORDER BY date DESC, id DESC");
    const mapped = data.map((row) => ({
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
      persona: row.persona || {}
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, domain, industry, template, date, status, defaultSendTime, selling_price, contacts, tasks: reqTasks, persona, autoFetch } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
    }

    const campaignId = id || "out-" + Date.now();
    const rawContacts = contacts || [];
    const finalTasks = reqTasks || [];
    const finalPersona = persona || { name: "", position: "", email: "", tone: "Professional" };
    const shouldAutoFetch = autoFetch !== false;

    // 1. Save campaign initially to database FIRST
    await sql(
      `INSERT INTO outbounds (id, domain, industry, template, date, status, default_send_time, selling_price, contacts, tasks, persona)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        campaignId,
        domain,
        industry,
        template,
        date || new Date().toISOString().split("T")[0],
        status || "Sent",
        defaultSendTime || "09:00",
        selling_price || null,
        JSON.stringify(rawContacts),
        JSON.stringify(finalTasks),
        JSON.stringify(finalPersona)
      ]
    );

    // 2. Trigger multi-stage Trigger.dev domain analyzer pipeline after saving to database
    let triggerTaskRunId = null;
    try {
      if (process.env.TRIGGER_SECRET_KEY) {
        const handle = await tasks.trigger("domain-analyzer", {
          domain,
          autoFetch: shouldAutoFetch,
          contacts: rawContacts
        });
        triggerTaskRunId = handle?.id || null;
      } else {
        // Run domain analyzer in non-blocking background promise if Trigger.dev SDK key is not set
        runDomainAnalyzer(domain, shouldAutoFetch, rawContacts).catch((err) => {
          console.error("Background domain analyzer error:", err);
        });
      }
    } catch (triggerErr) {
      console.warn("Trigger.dev trigger warning (falling back to background execution):", triggerErr.message);
      runDomainAnalyzer(domain, shouldAutoFetch, rawContacts).catch((err) => {
        console.error("Background domain analyzer error:", err);
      });
    }

    // 3. Immediately return response confirming saved campaign
    return NextResponse.json({
      success: true,
      id: campaignId,
      triggerTaskRunId,
      message: `Outbound campaign for ${domain} successfully saved. AI domain analysis and lead discovery tasks launched in background.`
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "clear") {
      await sql("DELETE FROM outbounds");
      return NextResponse.json({ success: true, message: "Cleared all outbounds" });
    } else if (mode === "reset") {
      await resetAndSeedOutbounds();
      return NextResponse.json({ success: true, message: "Reset to default outbounds" });
    } else {
      return NextResponse.json({ error: "Invalid mode parameter" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
