import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, position, email, tone, imageUrl, gender } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required fields" }, { status: 400 });
    }

    const existing = await sql("SELECT 1 FROM personas WHERE id = $1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    await sql(
      `UPDATE personas
       SET name = $1, position = $2, email = $3, tone = $4, image_url = $5, gender = $6
       WHERE id = $7`,
      [name.trim(), (position || "").trim(), email.trim(), tone || "Professional", (imageUrl || "").trim(), gender || "Male", id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await sql("SELECT 1 FROM personas WHERE id = $1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    await sql("DELETE FROM personas WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
