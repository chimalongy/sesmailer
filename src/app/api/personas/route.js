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
      gender: row.gender || "Male",
      replyToEmail: row.reply_to_email || row.email || "",
      companyAddress: row.company_address || "",
      companyAddress2: row.company_address_2 || "",
      city: row.city || "",
      state: row.state || "",
      zipCode: row.zip_code || "",
      country: row.country || "",
      sendgridSenderId: row.sendgrid_sender_id || "",
      sendgridVerified: Boolean(row.sendgrid_verified)
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      position,
      email,
      tone,
      imageUrl,
      gender,
      replyToEmail,
      companyAddress,
      companyAddress2,
      city,
      state,
      zipCode,
      country
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required fields" }, { status: 400 });
    }

    const id = "pers-" + Date.now();
    let sgSenderId = null;
    let sgVerified = false;

    // SendGrid Programmatic Sender Creation if API key exists
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      const cleanState = (state || "").trim();
      const formattedState = cleanState.length > 2 ? cleanState.substring(0, 2).toUpperCase() : cleanState;

      try {
        const sgPayload = {
          nickname: `${name.trim()} (${(position || "Broker").trim()})`,
          from_email: email.trim(),
          from_name: name.trim(),
          reply_to: (replyToEmail || email).trim(),
          reply_to_name: name.trim(),
          address: (companyAddress || "38 Aminat Street").trim(),
          address2: (companyAddress2 || "").trim(),
          city: (city || "Lagos").trim(),
          state: formattedState,
          zip: (zipCode || "100001").trim(),
          country: (country || "Nigeria").trim()
        };

        const sgRes = await fetch("https://api.sendgrid.com/v3/verified_senders", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(sgPayload)
        });

        if (sgRes.ok) {
          const sgData = await sgRes.json();
          sgSenderId = String(sgData.id || "");
          sgVerified = Boolean(sgData.verified);
        } else {
          const sgErr = await sgRes.json();
          console.warn("SendGrid Verified Sender creation warning:", sgErr);
        }
      } catch (sgError) {
        console.warn("SendGrid API request failed during persona creation:", sgError.message);
      }
    }

    await sql(
      `INSERT INTO personas (
        id, name, position, email, tone, image_url, gender,
        reply_to_email, company_address, company_address_2, city, state, zip_code, country,
        sendgrid_sender_id, sendgrid_verified
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        name.trim(),
        (position || "").trim(),
        email.trim(),
        tone || "Professional",
        (imageUrl || "").trim(),
        gender || "Male",
        (replyToEmail || email).trim(),
        (companyAddress || "").trim(),
        (companyAddress2 || "").trim(),
        (city || "").trim(),
        (state || "").trim(),
        (zipCode || "").trim(),
        (country || "").trim(),
        sgSenderId,
        sgVerified
      ]
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

    return NextResponse.json({
      success: true,
      id,
      sendgridSenderId: sgSenderId,
      sendgridVerified: sgVerified
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
