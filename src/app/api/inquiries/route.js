import { NextResponse } from "next/server";
import { sql, ensureTablesExistAndSeeded } from "@/lib/db";

export async function GET() {
  await ensureTablesExistAndSeeded();
  try {
    const data = await sql("SELECT * FROM inquiries ORDER BY date DESC, id DESC");
    const mapped = data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      domain: row.domain,
      offerPrice: row.offer_price,
      message: row.message,
      date: row.date,
      status: row.status
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, domain, offerPrice, message } = body;

    if (!name || !email || !domain) {
      return NextResponse.json({ error: "Name, email, and domain are required" }, { status: 400 });
    }

    const id = "inq-" + Date.now();
    const date = new Date().toISOString().split("T")[0];

    await sql(
      `INSERT INTO inquiries (id, name, email, domain, offer_price, message, date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        name,
        email,
        domain.toLowerCase().trim(),
        offerPrice || null,
        message || "",
        date,
        "New"
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
