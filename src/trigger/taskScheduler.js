import { schedules } from "@trigger.dev/sdk/v3";
import { Client } from "@upstash/qstash";
import { sql } from "@/lib/db";

/**
 * Orchestrator helper to scan today's scheduled tasks and queue them in QStash
 */
export async function runTaskScheduler() {
  console.log("[Task Scheduler]: Starting 2:00 AM daily task scheduler run...");

  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    console.warn("[Task Scheduler]: QSTASH_TOKEN missing from environment. QStash queueing disabled.");
  }

  const qstash = qstashToken ? new Client({ token: qstashToken }) : null;

  // 1. Fetch all outbound campaigns from Neon Postgres DB
  const res = await sql("SELECT * FROM outbounds WHERE status != 'Bounced'");
  const campaigns = res.rows || res || [];

  const todayStr = new Date().toISOString().split("T")[0];
  let queuedCount = 0;

  for (const campaign of campaigns) {
    let tasksList = Array.isArray(campaign.tasks)
      ? campaign.tasks
      : typeof campaign.tasks === "string"
      ? JSON.parse(campaign.tasks)
      : [];

    let hasUpdates = false;

    for (let i = 0; i < tasksList.length; i++) {
      const taskItem = tasksList[i];

      // Match tasks scheduled for TODAY that have status 'scheduled'
      if (taskItem.schedule_date === todayStr && taskItem.task_status === "scheduled") {
        console.log(`[Task Scheduler]: Found scheduled task "${taskItem.task_id}" for domain "${campaign.domain}".`);

        // Compute target send time from default_send_time (default "09:00")
        const sendTimeStr = campaign.default_send_time || "09:00";
        const [hoursStr, minutesStr] = sendTimeStr.split(":");
        const targetDate = new Date();
        targetDate.setUTCHours(parseInt(hoursStr || "9", 10), parseInt(minutesStr || "0", 10), 0, 0);

        const now = new Date();
        // If target send time has already passed today, dispatch immediately or set small 10s delay
        let notBeforeSec = Math.floor(targetDate.getTime() / 1000);
        if (targetDate.getTime() <= now.getTime()) {
          notBeforeSec = Math.floor((now.getTime() + 10000) / 1000);
        }

        const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://geniusdomainnames.com";
        const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/qstash/execute-task`;

        const payload = {
          domain: campaign.domain,
          taskId: taskItem.task_id,
          taskSubject: taskItem.task_subject,
          taskMessage: taskItem.task_message,
          persona: campaign.persona || {}
        };

        if (qstash) {
          try {
            await qstash.publishJSON({
              url: callbackUrl,
              body: payload,
              notBefore: notBeforeSec
            });
            console.log(`[Task Scheduler]: Successfully published delayed task "${taskItem.task_id}" to QStash targeting ${callbackUrl}.`);
          } catch (qErr) {
            console.error(`[Task Scheduler]: QStash publish error for task "${taskItem.task_id}":`, qErr.message);
          }
        }

        // Update task_status to 'queued' in tasks array
        tasksList[i] = {
          ...taskItem,
          task_status: "queued"
        };
        hasUpdates = true;
        queuedCount++;
      }
    }

    if (hasUpdates) {
      await sql(
        `UPDATE outbounds SET tasks = $1 WHERE LOWER(domain) = LOWER($2)`,
        [JSON.stringify(tasksList), campaign.domain.toLowerCase().trim()]
      );
    }
  }

  console.log(`[Task Scheduler]: Completed 2:00 AM daily run. Total tasks queued with QStash: ${queuedCount}.`);

  return {
    success: true,
    todayStr,
    queuedCount
  };
}

/**
 * Trigger.dev 2:00 AM Daily Cron Task definition
 */
export const taskSchedulerTask = schedules.task({
  id: "task-scheduler",
  cron: "0 2 * * *", // Runs every night at 2:00 AM UTC
  run: async () => {
    return await runTaskScheduler();
  },
});
