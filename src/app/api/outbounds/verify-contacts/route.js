import { NextResponse } from "next/server";
import { runVerifyCampaignContacts } from "@/trigger/verifyCampaignContacts";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(request) {
  try {
    const body = await request.json();
    const { domain, contacts } = body;

    if (!domain && (!contacts || contacts.length === 0)) {
      return NextResponse.json(
        { error: "Domain or contacts list is required for email verification" },
        { status: 400 }
      );
    }

    // 1. Attempt to trigger the Trigger.dev background task asynchronously if Trigger.dev context is available
    let triggerTaskRunId = null;
    try {
      if (process.env.TRIGGER_SECRET_KEY) {
        const handle = await tasks.trigger("verify-campaign-contacts", {
          domain,
          contacts
        });
        triggerTaskRunId = handle?.id || null;
      }
    } catch (triggerErr) {
      console.warn("Trigger.dev async trigger warning (falling back to direct verification):", triggerErr.message);
    }

    // 2. Perform direct execution of verification using checkEmail orchestrator
    const result = await runVerifyCampaignContacts(domain, contacts);

    return NextResponse.json({
      success: true,
      triggerTaskRunId,
      ...result
    });

  } catch (error) {
    console.error("Verify contacts API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify campaign contacts" },
      { status: 500 }
    );
  }
}
