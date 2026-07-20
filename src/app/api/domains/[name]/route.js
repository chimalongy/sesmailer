import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { category, description, tags, badge, price, purchase_price, type, city, niche } = body;

    await sql(
      `UPDATE domains
       SET category = $1, description = $2, tags = $3, badge = $4, price = $5, purchase_price = $6, type = $7, city = $8, niche = $9
       WHERE name = $10`,
      [category, description, tags, badge, price, purchase_price, type || "Brandable Domain", city || null, niche || null, decodeURIComponent(name)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { name } = await params;
    await sql("DELETE FROM domains WHERE name = $1", [decodeURIComponent(name)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
