import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subject, message, category } = body;

    if (!name || !subject || !message || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await sql("SELECT 1 FROM templates WHERE id = $1 LIMIT 1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await sql(
      `UPDATE templates
       SET name = $1, subject = $2, message = $3, category = $4
       WHERE id = $5`,
      [name.trim(), subject.trim(), message.trim(), category, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await sql("SELECT 1 FROM templates WHERE id = $1 LIMIT 1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await sql("DELETE FROM templates WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
