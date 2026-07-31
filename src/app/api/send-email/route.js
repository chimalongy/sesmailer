import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { sql } from "@/lib/db";

async function ensureTableExists() {
  try {
    await sql(`
      CREATE TABLE IF NOT EXISTS single_emails (
        id VARCHAR(50) PRIMARY KEY,
        to_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255),
        from_email VARCHAR(255) NOT NULL,
        reply_to VARCHAR(255),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Sent',
        message_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        messages JSONB DEFAULT '[]'::jsonb
      );
    `);
  } catch (err) {
    console.error("Error creating single_emails table:", err);
  }
}

export async function GET() {
  try {
    await ensureTableExists();
    const res = await sql("SELECT * FROM single_emails ORDER BY created_at DESC");
    const rows = res.rows || res || [];
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch single_emails:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch single emails" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, message, fromName, fromEmail, replyTo } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 }
      );
    }

    if (!fromEmail) {
      return NextResponse.json(
        { error: "Sender email (fromEmail) is required" },
        { status: 400 }
      );
    }

    // ── SendGrid credentials check ───────────────────────────────────────────
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "SendGrid is not configured. Add SENDGRID_API_KEY to your .env file.",
          missingConfig: true
        },
        { status: 503 }
      );
    }

    sgMail.setApiKey(apiKey);

    // ── Convert plain-text body to minimal HTML (preserves line breaks) ───────
    const htmlBody = `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`;

    // ── Send via SendGrid ──────────────────────────────────────────────────────
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: fromName ? { name: fromName, email: fromEmail } : fromEmail,
      subject: subject,
      text: message,
      html: htmlBody,
      ...(replyTo ? { replyTo } : {})
    };

    const [response] = await sgMail.send(msg);

    const messageId = response.headers["x-message-id"] || response.headers["message-id"] || "sg-" + Date.now();

    // ── Save to Database ──────────────────────────────────────────────────────
    await ensureTableExists();
    const singleId = "se-" + Date.now();
    const toEmailStr = (Array.isArray(to) ? to.join(", ") : to).toLowerCase().trim();
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const initialMessages = [
      {
        id: messageId,
        sender: "me",
        date: dateStr,
        time: timeStr,
        subject: subject,
        body: message
      }
    ];

    try {
      await sql(
        `INSERT INTO single_emails (id, to_email, from_name, from_email, reply_to, subject, message, status, message_id, messages)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          singleId,
          toEmailStr,
          fromName || "",
          fromEmail.trim(),
          replyTo || "",
          subject.trim(),
          message.trim(),
          "Sent",
          messageId,
          JSON.stringify(initialMessages)
        ]
      );
    } catch (dbErr) {
      console.error("Failed to save single_email to database:", dbErr);
    }

    return NextResponse.json({
      success: true,
      messageId: messageId,
      singleId: singleId,
      to,
      subject
    });
  } catch (error) {
    console.error("SendGrid send error:", error);

    // Surface SendGrid response errors cleanly
    const sgErrorMessage = error.response?.body?.errors?.[0]?.message || error.message || "Failed to send email via SendGrid";

    return NextResponse.json(
      { error: sgErrorMessage },
      { status: error.code || 500 }
    );
  }
}

