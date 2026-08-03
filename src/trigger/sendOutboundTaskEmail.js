import { task } from "@trigger.dev/sdk/v3";
import sgMail from "@sendgrid/mail";
import { sql } from "@/lib/db";

/**
 * Orchestrator helper to execute email dispatch for a specific outbound campaign sequence task
 */
export async function runSendOutboundTaskEmail({ domain, taskId, taskSubject, taskMessage, persona }) {
  console.log(`[Send Outbound Task Email]: Starting dispatch for domain "${domain}", task ID "${taskId}"...`);

  if (!domain || !taskSubject || !taskMessage) {
    throw new Error("[Send Outbound Task Email]: Missing required fields: domain, taskSubject, taskMessage.");
  }

  // 1. Fetch Outbound Campaign from Neon Postgres DB
  const res = await sql(
    "SELECT * FROM outbounds WHERE LOWER(domain) = LOWER($1) LIMIT 1",
    [domain.toLowerCase().trim()]
  );
  const rows = res.rows || res || [];

  if (rows.length === 0) {
    throw new Error(`[Send Outbound Task Email]: Outbound campaign for "${domain}" not found in database.`);
  }

  const campaign = rows[0];
  let contacts = Array.isArray(campaign.contacts)
    ? campaign.contacts
    : typeof campaign.contacts === "string"
    ? JSON.parse(campaign.contacts)
    : [];

  let tasksList = Array.isArray(campaign.tasks)
    ? campaign.tasks
    : typeof campaign.tasks === "string"
    ? JSON.parse(campaign.tasks)
    : [];

  const activePersona = persona || campaign.persona || {};
  const fromName = activePersona.name || "Domain Broker";
  const fromEmail = activePersona.email || process.env.SENDGRID_FROM_EMAIL || "broker@geniusdomains.com";
  const replyTo = activePersona.reply_to_email || activePersona.replyToEmail || activePersona.email || fromEmail;

  if (contacts.length === 0) {
    console.warn(`[Send Outbound Task Email]: No contacts found for campaign "${domain}".`);
    return { success: false, reason: "No contacts found" };
  }

  const targetContacts = contacts.filter((c) => c.deliveryStatus !== "Bounced");
  if (targetContacts.length === 0) {
    console.warn(`[Send Outbound Task Email]: All contacts for campaign "${domain}" have bounced. Dispatch skipped.`);
    return { success: false, reason: "All contacts bounced" };
  }

  // 2. Configure SendGrid API if key is set
  const apiKey = process.env.SENDGRID_API_KEY;
  const isSendGridActive = Boolean(apiKey);
  if (isSendGridActive) {
    sgMail.setApiKey(apiKey);
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let sentCount = 0;
  const sendErrors = [];

  // 3. Send email to each non-bounced contact
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    if (contact.deliveryStatus === "Bounced" || contact.deliveryStatus === "Unsubscribed" || contact.verificationStatus === "unsubscribed") continue;

    const messageId = "out-msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    let sendSuccess = true;

    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const unsubscribeUrl = `${baseUrl.replace(/\/$/, "")}/unsubscribe?email=${encodeURIComponent(contact.email)}&domain=${encodeURIComponent(domain)}`;

    const textWithUnsubscribe = `${taskMessage}\n\n---\nIf you prefer not to receive future emails regarding ${domain}, unsubscribe here: ${unsubscribeUrl}`;
    const htmlWithUnsubscribe = `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;">${taskMessage.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre><div style="margin-top:32px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:11px;color:#71717a;font-family:sans-serif;"><p style="margin:0;">If you prefer not to receive future emails regarding ${domain}, <a href="${unsubscribeUrl}" style="color:#6366f1;text-decoration:underline;">click here to unsubscribe</a>.</p></div>`;

    if (isSendGridActive) {
      try {
        const msg = {
          to: contact.email,
          from: fromName ? { name: fromName, email: fromEmail } : fromEmail,
          subject: taskSubject,
          text: textWithUnsubscribe,
          html: htmlWithUnsubscribe,
          ...(replyTo ? { replyTo } : {})
        };

        await sgMail.send(msg);
      } catch (sgErr) {
        sendSuccess = false;
        const errMsg = sgErr.response?.body?.errors?.[0]?.message || sgErr.message || "Failed to send email via SendGrid";
        sendErrors.push(`${contact.email}: ${errMsg}`);
        console.error(`[Send Outbound Task Email]: SendGrid error for ${contact.email}:`, sgErr);
      }
    }

    if (sendSuccess) {
      sentCount++;
      const currentMessages = Array.isArray(contact.messages) ? contact.messages : [];
      const newSentLog = {
        id: messageId,
        sender: "outbound-system",
        date: dateStr,
        time: timeStr,
        subject: taskSubject,
        body: taskMessage
      };

      const isDuplicate = currentMessages.some((m) => m.body === taskMessage && m.subject === taskSubject);
      if (!isDuplicate) {
        contacts[i] = {
          ...contact,
          deliveryStatus: contact.deliveryStatus === "Replied" ? "Replied" : "Sent",
          messages: [...currentMessages, newSentLog]
        };
      }
    }
  }

  // 4. Update task_status to 'completed' in tasks array
  if (taskId) {
    tasksList = tasksList.map((t) => {
      if (t.task_id === taskId) {
        return { ...t, task_status: "completed", task_subject: taskSubject, task_message: taskMessage };
      }
      return t;
    });
  }

  // Determine campaign status
  let campaignStatus = campaign.status;
  const hasReplied = contacts.some((c) => c.deliveryStatus === "Replied");
  const hasOpened = contacts.some((c) => c.deliveryStatus === "Opened");
  if (hasReplied) campaignStatus = "Replied";
  else if (hasOpened) campaignStatus = "Opened";
  else if (sentCount > 0) campaignStatus = "Sent";

  // 5. Update Neon Postgres DB
  await sql(
    `UPDATE outbounds 
     SET contacts = $1, tasks = $2, status = $3, persona = $4 
     WHERE LOWER(domain) = LOWER($5)`,
    [JSON.stringify(contacts), JSON.stringify(tasksList), campaignStatus, JSON.stringify(activePersona), domain.toLowerCase().trim()]
  );

  console.log(`[Send Outbound Task Email]: Successfully dispatched task "${taskId}" for "${domain}" to ${sentCount} contact(s).`);

  return {
    success: true,
    domain,
    taskId,
    sentCount,
    totalContacts: targetContacts.length,
    sendErrors
  };
}

/**
 * Trigger.dev task definition for Send Outbound Task Email
 */
export const sendOutboundTaskEmailTask = task({
  id: "send-outbound-task-email",
  maxDuration: 600,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
  },
  run: async (payload, { ctx }) => {
    console.log(`[Task ${ctx.run.id}]: Running send-outbound-task-email for domain ${payload?.domain}...`);
    return await runSendOutboundTaskEmail(payload);
  },
});
