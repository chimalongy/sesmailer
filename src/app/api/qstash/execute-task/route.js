import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { tasks } from "@trigger.dev/sdk/v3";
import { runSendOutboundTaskEmail } from "@/trigger/sendOutboundTaskEmail";

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    // Verify QStash signature if keys are provided in environment
    if (currentSigningKey && nextSigningKey) {
      const signature = request.headers.get("upstash-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing Upstash-Signature header" }, { status: 401 });
      }

      const receiver = new Receiver({
        currentSigningKey,
        nextSigningKey,
      });

      const isValid = await receiver.verify({
        signature,
        body: rawBody,
      }).catch((err) => {
        console.warn("[QStash Webhook]: Signature verification failed:", err.message);
        return false;
      });

      if (!isValid) {
        return NextResponse.json({ error: "Invalid QStash signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const { domain, taskId, taskSubject, taskMessage, persona } = payload;

    if (!domain || !taskSubject || !taskMessage) {
      return NextResponse.json(
        { error: "Missing required fields: domain, taskSubject, taskMessage" },
        { status: 400 }
      );
    }

    console.log(`[QStash Callback]: Received execution trigger for domain "${domain}", task ID "${taskId}".`);

    // Trigger Trigger.dev task send-outbound-task-email to dispatch emails via SendGrid
    let triggerTaskRunId = null;
    try {
      if (process.env.TRIGGER_SECRET_KEY) {
        const handle = await tasks.trigger("send-outbound-task-email", {
          domain,
          taskId,
          taskSubject,
          taskMessage,
          persona
        });
        triggerTaskRunId = handle?.id || null;
      } else {
        // Fallback to inline background execution
        runSendOutboundTaskEmail({ domain, taskId, taskSubject, taskMessage, persona }).catch((err) => {
          console.error("[QStash Callback]: Background email task error:", err);
        });
      }
    } catch (triggerErr) {
      console.warn("[QStash Callback]: Trigger.dev task trigger warning, running inline:", triggerErr.message);
      runSendOutboundTaskEmail({ domain, taskId, taskSubject, taskMessage, persona }).catch((err) => {
        console.error("[QStash Callback]: Background email task error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      domain,
      taskId,
      triggerTaskRunId,
      message: `Trigger.dev task send-outbound-task-email successfully launched for domain "${domain}".`
    });

  } catch (error) {
    console.error("[QStash Callback]: Execution route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process QStash task execution callback" },
      { status: 500 }
    );
  }
}
