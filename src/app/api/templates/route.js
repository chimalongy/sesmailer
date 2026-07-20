import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql("SELECT * FROM templates ORDER BY category ASC, name ASC");
    const mapped = data.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      message: row.message,
      category: row.category
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 550 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, subject, message, category } = body;

    if (!name || !subject || !message || !category) {
      return NextResponse.json({ error: "Missing required fields: name, subject, message, category" }, { status: 400 });
    }

    const id = "temp-" + Date.now();
    await sql(
      `INSERT INTO templates (id, name, subject, message, category)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name.trim(), subject.trim(), message.trim(), category]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id         = searchParams.get("id");
    const namePrefix = searchParams.get("namePrefix");

    if (id) {
      await sql("DELETE FROM templates WHERE id = $1", [id]);
      return NextResponse.json({ success: true, deleted: id });
    }

    if (namePrefix) {
      await sql("DELETE FROM templates WHERE name LIKE $1", [namePrefix + "%"]);
      return NextResponse.json({ success: true, deleted: namePrefix + "*" });
    }

    return NextResponse.json({ error: "Provide ?id=xxx or ?namePrefix=xxx" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

