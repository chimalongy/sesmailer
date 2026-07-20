import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// ── SES client (reads from env at request time) ───────────────────────────────
function getSESClient() {
  const region      = process.env.AWS_REGION      || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretKey   = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretKey) {
    return null;
  }

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey: secretKey }
  });
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

    // ── SES credentials check ─────────────────────────────────────────────────
    const ses = getSESClient();
    if (!ses) {
      return NextResponse.json(
        {
          error: "AWS SES is not configured. Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION to your .env.local file.",
          missingConfig: true
        },
        { status: 503 }
      );
    }

    // ── Build sender string ───────────────────────────────────────────────────
    const fromAddress = fromName
      ? `${fromName} <${fromEmail}>`
      : fromEmail;

    // ── Convert plain-text body to minimal HTML (preserves line breaks) ───────
    const htmlBody = `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`;

    // ── Send via SES ──────────────────────────────────────────────────────────
    const command = new SendEmailCommand({
      Source: fromAddress,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data:    subject,
          Charset: "UTF-8"
        },
        Body: {
          Text: { Data: message,  Charset: "UTF-8" },
          Html: { Data: htmlBody, Charset: "UTF-8" }
        }
      },
      ...(replyTo ? { ReplyToAddresses: [replyTo] } : {})
    });

    const result = await ses.send(command);

    return NextResponse.json({
      success:   true,
      messageId: result.MessageId,
      to,
      subject
    });
  } catch (error) {
    console.error("SES send error:", error);

    // Surface SES-specific error codes in a friendly way
    if (error.name === "MessageRejected") {
      return NextResponse.json({ error: "SES rejected the message: " + error.message }, { status: 422 });
    }
    if (error.name === "MailFromDomainNotVerifiedException" || error.name === "EmailAddressNotVerifiedException") {
      return NextResponse.json({ error: "Sender email is not verified in AWS SES. Verify the domain or address first." }, { status: 422 });
    }

    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
