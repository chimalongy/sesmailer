import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "@/lib/db";

function getS3Client() {
  const region      = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretKey   = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretKey) {
    return null;
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey: secretKey }
  });
}

// Helper to convert S3 stream to string
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

// ── Decode MIME Encoded Words in Headers (e.g. =?UTF-8?Q?Re=3A_... ?=) ────────
function decodeMIMEHeader(str) {
  if (!str) return "";
  return str.replace(/=\?([^?]+)\?([QBqb])\?([^?]+)\?=/g, (match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        return Buffer.from(text, "base64").toString("utf-8");
      } else if (encoding.toUpperCase() === "Q") {
        let qp = text.replace(/_/g, " ");
        qp = qp.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        const bytes = [];
        for (let i = 0; i < qp.length; i++) {
          bytes.push(qp.charCodeAt(i));
        }
        return Buffer.from(bytes).toString("utf-8");
      }
    } catch (e) {
      return text;
    }
    return text;
  });
}

// ── Decode Quoted-Printable Body Text ─────────────────────────────────────────
function decodeQuotedPrintable(str) {
  if (!str) return "";
  // Remove soft line breaks (=\r\n or =\n)
  let unsoft = str.replace(/=\r?\n/g, "");
  let bytes = [];
  for (let i = 0; i < unsoft.length; i++) {
    if (unsoft[i] === "=" && i + 2 < unsoft.length) {
      const hex = unsoft.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(unsoft.charCodeAt(i));
  }
  return Buffer.from(bytes).toString("utf-8");
}

// ── Parse Email Object (Supports JSON or Raw RFC 822 MIME MIME Text) ────────
function parseEmailObject(rawContent) {
  let trimmed = rawContent.trim();

  // 1. JSON Format Fallback
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const json = JSON.parse(trimmed);
      return {
        from: (json.from || json.sender || "").toLowerCase().trim(),
        to: (json.to || json.recipient || "").toLowerCase().trim(),
        subject: json.subject || "Re: Outbound Pitch",
        body: json.body || json.text || json.html || "",
        date: json.date || new Date().toISOString(),
        messageId: json.messageId || json.message_id || "",
        inReplyTo: json.inReplyTo || json.in_reply_to || "",
        references: json.references || ""
      };
    } catch (e) {
      // Fall through to MIME parser if JSON parse fails
    }
  }

  // 2. MIME RFC 822 Parser
  const lines = trimmed.split(/\r?\n/);
  const rawHeaders = [];
  let bodyStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      bodyStartIndex = i + 1;
      break;
    }
    // Handle folded headers (line starting with space or tab)
    if ((line.startsWith(" ") || line.startsWith("\t")) && rawHeaders.length > 0) {
      rawHeaders[rawHeaders.length - 1] += " " + line.trim();
    } else {
      rawHeaders.push(line);
    }
  }

  const headers = {};
  for (const h of rawHeaders) {
    const colonIdx = h.indexOf(":");
    if (colonIdx > 0) {
      const key = h.substring(0, colonIdx).trim().toLowerCase();
      const val = h.substring(colonIdx + 1).trim();
      headers[key] = decodeMIMEHeader(val);
    }
  }

  const rawBody = bodyStartIndex >= 0 ? lines.slice(bodyStartIndex).join("\n") : "";

  // Extract text/plain body from multipart boundaries if present
  let bodyText = "";
  const contentType = headers["content-type"] || "";
  if (contentType.includes("boundary=")) {
    const boundaryMatch = contentType.match(/boundary=["']?([^"';\s]+)["']?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = rawBody.split("--" + boundary);
      for (const part of parts) {
        if (part.toLowerCase().includes("text/plain")) {
          const partLines = part.split(/\r?\n/);
          let inPartHeaders = true;
          let isQP = part.toLowerCase().includes("content-transfer-encoding: quoted-printable");
          let partBodyLines = [];
          for (const pl of partLines) {
            if (inPartHeaders) {
              if (pl.trim() === "") inPartHeaders = false;
            } else {
              partBodyLines.push(pl);
            }
          }
          let text = partBodyLines.join("\n").trim();
          if (isQP) text = decodeQuotedPrintable(text);
          if (text) {
            bodyText = text;
            break;
          }
        }
      }
    }
  }

  if (!bodyText) {
    bodyText = rawBody.includes("Content-Transfer-Encoding: quoted-printable")
      ? decodeQuotedPrintable(rawBody)
      : rawBody;
  }

  const extractEmailAddr = (str) => {
    if (!str) return "";
    const match = str.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase().trim() : str.toLowerCase().trim();
  };

  const messageId = (headers["message-id"] || "").replace(/^<|>$/g, "").trim();
  const inReplyTo = (headers["in-reply-to"] || "").replace(/^<|>$/g, "").trim();
  const references = (headers["references"] || "").replace(/^<|>$/g, "").trim();

  return {
    from: extractEmailAddr(headers["from"]),
    to: extractEmailAddr(headers["to"]),
    subject: headers["subject"] || "Re: Outbound Pitch",
    date: headers["date"] || new Date().toISOString(),
    messageId,
    inReplyTo,
    references,
    body: bodyText.trim()
  };
}

// ── Normalize Subject for Matching ───────────────────────────────────────────
function normalizeSubject(sub) {
  if (!sub) return "";
  return sub
    .replace(/^(re|fwd|fw):\s*/i, "")
    .replace(/[\u2014\u2013\u2012-]/g, " ")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ── Match Scoring Algorithm ──────────────────────────────────────────────────
function calculateMatchScore(reply, candidate) {
  let score = 0;
  const prospectEmail = (reply.from || "").toLowerCase();
  const candToEmail = (candidate.to_email || candidate.email || "").toLowerCase();
  const candMsgId = (candidate.message_id || candidate.id || "").replace(/^<|>$/g, "").trim();
  const candSubject = candidate.subject || "";
  const candBody = candidate.message || candidate.body || "";

  // 1. Message-ID / In-Reply-To / References match (50 pts)
  if (candMsgId && candMsgId.length > 5) {
    const cleanCandId = candMsgId.split("@")[0];
    if (
      (reply.inReplyTo && (reply.inReplyTo.includes(cleanCandId) || cleanCandId.includes(reply.inReplyTo))) ||
      (reply.references && (reply.references.includes(cleanCandId) || cleanCandId.includes(reply.references)))
    ) {
      score += 50;
    }
  }

  // 2. Prospect Email Address match (30 pts)
  if (prospectEmail && candToEmail && (prospectEmail === candToEmail || candToEmail.includes(prospectEmail))) {
    score += 30;
  }

  // 3. Normalized Subject match (30 pts for exact, 20 pts for partial)
  const normReplySub = normalizeSubject(reply.subject);
  const normCandSub = normalizeSubject(candSubject);
  if (normReplySub && normCandSub) {
    if (normReplySub === normCandSub) {
      score += 30;
    } else if (normReplySub.includes(normCandSub) || normCandSub.includes(normReplySub)) {
      score += 20;
    }
  }

  // 4. Quoted Body Content match (20 pts)
  if (candBody && candBody.length > 15 && reply.body) {
    const snippet = candBody.substring(0, 40).trim();
    if (snippet && reply.body.includes(snippet)) {
      score += 20;
    }
  }

  return score;
}

export async function POST(request) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET || process.env.S3_REPLIES_BUCKET;
    const s3 = getS3Client();

    if (!s3 || !bucketName) {
      return NextResponse.json(
        {
          error: "AWS S3 replies bucket is not configured. Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET to your .env file.",
          missingConfig: true
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetDomain = body.domain || null;

    // List objects in S3 bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 50
    });

    const listResult = await s3.send(listCommand);
    const s3Objects = listResult.Contents || [];

    if (s3Objects.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No email reply objects found in S3 bucket."
      });
    }

    // Fetch campaigns from Database
    let query = "SELECT id, domain, status, contacts FROM outbounds";
    let params = [];
    if (targetDomain) {
      query += " WHERE domain = $1";
      params.push(targetDomain);
    }

    const outboundsRes = await sql(query, params).catch(() => ({ rows: [] }));
    const campaigns = outboundsRes.rows || outboundsRes || [];

    // Fetch single_emails from Database
    let singleEmails = [];
    try {
      const singleRes = await sql("SELECT * FROM single_emails");
      singleEmails = singleRes.rows || singleRes || [];
    } catch (e) {
      // Table might not exist yet
    }

    let syncedCount = 0;

    for (const obj of s3Objects) {
      if (!obj.Key) continue;

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: obj.Key
      });

      const getResult = await s3.send(getCommand);
      const rawContent = await streamToString(getResult.Body);
      const parsed = parseEmailObject(rawContent);

      if (!parsed.from && !parsed.subject) continue;

      // Format date/time
      const dateObj = parsed.date ? new Date(parsed.date) : new Date();
      const formattedDate = isNaN(dateObj.getTime()) ? new Date().toISOString().split("T")[0] : dateObj.toISOString().split("T")[0];
      const formattedTime = isNaN(dateObj.getTime()) ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const replyMsg = {
        id: parsed.messageId ? "s3-" + parsed.messageId : ("s3-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7)),
        sender: "prospect",
        date: formattedDate,
        time: formattedTime,
        subject: parsed.subject,
        body: parsed.body
      };

      // ── MATCHING STEP 1: Single Emails ──────────────────────────────────────
      let bestSingleMatch = null;
      let bestSingleScore = 0;

      for (const se of singleEmails) {
        const score = calculateMatchScore(parsed, se);
        if (score > bestSingleScore) {
          bestSingleScore = score;
          bestSingleMatch = se;
        }
      }

      if (bestSingleMatch && bestSingleScore >= 30) {
        let messages = Array.isArray(bestSingleMatch.messages)
          ? bestSingleMatch.messages
          : typeof bestSingleMatch.messages === "string"
          ? JSON.parse(bestSingleMatch.messages)
          : [];

        const isDuplicate = messages.some(
          (m) => (m.id && replyMsg.id && m.id === replyMsg.id) || (m.body && m.body === replyMsg.body)
        );

        if (!isDuplicate) {
          syncedCount++;
          const updatedMessages = [...messages, replyMsg];
          await sql(
            "UPDATE single_emails SET messages = $1, status = $2 WHERE id = $3",
            [JSON.stringify(updatedMessages), "Replied", bestSingleMatch.id]
          );
          continue; // Processed for this S3 object
        }
      }

      // ── MATCHING STEP 2: Campaign Contacts ──────────────────────────────────
      for (const campaign of campaigns) {
        let contacts = Array.isArray(campaign.contacts)
          ? campaign.contacts
          : typeof campaign.contacts === "string"
          ? JSON.parse(campaign.contacts)
          : [];

        let bestContactIdx = -1;
        let bestContactScore = 0;

        contacts.forEach((c, idx) => {
          const score = calculateMatchScore(parsed, c);
          if (score > bestContactScore) {
            bestContactScore = score;
            bestContactIdx = idx;
          }
        });

        if (bestContactIdx >= 0 && bestContactScore >= 30) {
          const matchedContact = contacts[bestContactIdx];
          const existingMsgs = matchedContact.messages || [];

          const isDuplicate = existingMsgs.some(
            (m) => (m.id && replyMsg.id && m.id === replyMsg.id) || (m.body && m.body === replyMsg.body)
          );

          if (!isDuplicate) {
            syncedCount++;
            contacts[bestContactIdx] = {
              ...matchedContact,
              deliveryStatus: "Replied",
              messages: [...existingMsgs, replyMsg]
            };

            await sql(
              "UPDATE outbounds SET contacts = $1, status = $2 WHERE id = $3",
              [JSON.stringify(contacts), "Replied", campaign.id]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: syncedCount,
      message: `Successfully processed ${s3Objects.length} S3 objects. Synced ${syncedCount} new replies.`
    });

  } catch (error) {
    console.error("S3 fetch replies error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch replies from S3" },
      { status: 500 }
    );
  }
}
