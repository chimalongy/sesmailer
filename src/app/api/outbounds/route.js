import { NextResponse } from "next/server";
import { sql, ensureTablesExistAndSeeded, resetAndSeedOutbounds } from "@/lib/db";

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
    const { id, domain, industry, template, date, status, defaultSendTime, selling_price, contacts, tasks, persona } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
    }

    const campaignId = id || "out-" + Date.now();
    const finalContacts = contacts || [];
    const finalTasks = tasks || [];
    const finalPersona = persona || { name: "", position: "", email: "", tone: "Professional" };

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
        JSON.stringify(finalContacts),
        JSON.stringify(finalTasks),
        JSON.stringify(finalPersona)
      ]
    );

    return NextResponse.json({ success: true, id: campaignId });
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
