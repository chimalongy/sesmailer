import { NextResponse } from "next/server";
import { scrapeTeethWhiteningTask, runScrape } from "../../../trigger/scrapeTeethWhitening";

export async function POST(req) {
  try {
    const { location, niche } = await req.json().catch(() => ({}));

    const loc = location || "Milwaukee";
    const nic = niche || "dental clinics";

    console.log(`[API]: Triggering scraper task for ${nic} in ${loc}...`);

    try {
      // 1. Attempt to run via Trigger.dev background task SDK
      // NOTE: this only *queues* the run on Trigger.dev's servers.
      // For it to actually execute, either:
      //   - `npx trigger.dev@latest dev` must be running locally, or
      //   - the task must be deployed via `npx trigger.dev@latest deploy`
      // Otherwise the run will sit queued/unresolved and you won't see it here.
      const run = await scrapeTeethWhiteningTask.trigger({
        location: loc,
        niche: nic
      });

      return NextResponse.json({
        success: true,
        message: "Scraper task successfully queued on Trigger.dev!",
        runId: run.id,
        location: loc,
        niche: nic,
        isSimulation: false,
        note: "Check the Trigger.dev dashboard for this run's actual execution status."
      });
    } catch (triggerErr) {
      console.warn("Trigger.dev SDK failed, falling back to local inline scrape:", triggerErr.message);

      // 2. Fall back to local synchronous execution
      try {
        const results = await runScrape(loc, nic);

        return NextResponse.json({
          success: true,
          message: "Scraper executed successfully locally (Trigger.dev fallback active)!",
          runId: "local-run-" + Date.now(),
          location: loc,
          niche: nic,
          isSimulation: true,
          triggerError: triggerErr.message,
          results
        });
      } catch (fallbackErr) {
        // Both paths failed -- surface both errors instead of masking the real cause
        console.error("Local fallback scrape also failed:", fallbackErr.message);
        return NextResponse.json({
          success: false,
          error: "Both Trigger.dev and local fallback failed.",
          triggerError: triggerErr.message,
          fallbackError: fallbackErr.message
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Scraper trigger API Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to trigger scraper task."
    }, { status: 500 });
  }
}