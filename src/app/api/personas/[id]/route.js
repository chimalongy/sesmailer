import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    const existingRows = await sql("SELECT * FROM personas WHERE id = $1", [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const persona = existingRows[0];
    let sgSenderId = persona.sendgrid_sender_id;
    let sgVerified = persona.sendgrid_verified;

    // Sync updates with SendGrid if API key exists
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      const cleanState = (state || "").trim();
      const formattedState = cleanState.length > 2 ? cleanState.substring(0, 2).toUpperCase() : cleanState;

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

      try {
        if (sgSenderId) {
          await fetch(`https://api.sendgrid.com/v3/verified_senders/${sgSenderId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(sgPayload)
          });
        } else {
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
          }
        }
      } catch (err) {
        console.warn("SendGrid sync error on PUT:", err.message);
      }
    }

    await sql(
      `UPDATE personas
       SET name = $1, position = $2, email = $3, tone = $4, image_url = $5, gender = $6,
           reply_to_email = $7, company_address = $8, company_address_2 = $9, city = $10,
           state = $11, zip_code = $12, country = $13, sendgrid_sender_id = $14, sendgrid_verified = $15
       WHERE id = $16`,
      [
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
        sgVerified,
        id
      ]
    );

    return NextResponse.json({ success: true, sendgridSenderId: sgSenderId, sendgridVerified: sgVerified });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await sql("SELECT sendgrid_sender_id FROM personas WHERE id = $1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const sgSenderId = existing[0].sendgrid_sender_id;
    const apiKey = process.env.SENDGRID_API_KEY;

    if (apiKey && sgSenderId) {
      try {
        await fetch(`https://api.sendgrid.com/v3/verified_senders/${sgSenderId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${apiKey}`
          }
        });
      } catch (err) {
        console.warn("Failed to delete sender from SendGrid API:", err.message);
      }
    }

    await sql("DELETE FROM personas WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
