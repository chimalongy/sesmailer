import { NextResponse } from "next/server";
import { sql, ensureTablesExistAndSeeded } from "@/lib/db";

export async function GET() {
  await ensureTablesExistAndSeeded();
  try {
    const data = await sql("SELECT * FROM domains ORDER BY name ASC");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, description, tags, badge, price, purchase_price, type, city, niche } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
    }

    await sql(
      `INSERT INTO domains (name, category, description, tags, badge, price, purchase_price, type, city, niche)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        name.toLowerCase().trim(),
        category || "AI & Tech",
        description || "Premium domain name available for acquisition.",
        tags || ["Premium"],
        badge || "",
        price || "Inquire",
        purchase_price || null,
        type || "Brandable Domain",
        city || null,
        niche || null
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
