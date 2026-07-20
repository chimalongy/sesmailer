import { NextResponse } from "next/server";
import { sql, ensureTablesExistAndSeeded } from "@/lib/db";
import { generatePersonaImageTask, runGeneratePersonaImage } from "../../../trigger/generatePersonaImage";

export async function GET() {
  await ensureTablesExistAndSeeded();
  try {
    const data = await sql("SELECT * FROM personas ORDER BY id ASC");
    const mapped = data.map(row => ({
      id: row.id,
      name: row.name,
      position: row.position,
      email: row.email,
      tone: row.tone,
      imageUrl: row.image_url || "",
      gender: row.gender || "Male"
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, position, email, tone, imageUrl, gender } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required fields" }, { status: 400 });
    }

    const id = "pers-" + Date.now();
    await sql(
      `INSERT INTO personas (id, name, position, email, tone, image_url, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name.trim(), (position || "").trim(), email.trim(), tone || "Professional", (imageUrl || "").trim(), gender || "Male"]
    );

    // Trigger the avatar generation task
    try {
      await generatePersonaImageTask.trigger({ id });
    } catch (triggerErr) {
      console.warn("Trigger.dev queue submission failed, running image generator inline:", triggerErr.message);
      try {
        await runGeneratePersonaImage(id);
      } catch (fallbackErr) {
        console.error("Local fallback image generator also failed:", fallbackErr.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
