import { NextResponse } from "next/server";
import { checkEmail } from "@/lib/verifyEmail";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, emails } = body;

    // Single Email Verification
    if (email && typeof email === "string") {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return NextResponse.json({ error: "Email address cannot be empty" }, { status: 400 });
      }

      const startTime = Date.now();
      const result = await checkEmail(trimmedEmail, { doSmtpCheck: true });
      const durationMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        durationMs,
        result
      });
    }

    // Bulk Emails Verification
    if (Array.isArray(emails) && emails.length > 0) {
      const startTime = Date.now();
      const results = [];
      const valid = [];
      const risky = [];
      const invalid = [];

      for (const item of emails) {
        const targetEmail = typeof item === "string" ? item.trim() : item.email?.trim();
        if (!targetEmail) continue;

        try {
          const res = await checkEmail(targetEmail, { doSmtpCheck: true });
          results.push(res);

          if (res.verdict === "valid") {
            valid.push(res);
          } else if (res.verdict === "invalid") {
            invalid.push(res);
          } else {
            risky.push(res);
          }
        } catch (err) {
          const errorRes = {
            email: targetEmail,
            verdict: "risky",
            error: err.message
          };
          results.push(errorRes);
          risky.push(errorRes);
        }
      }

      const durationMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        durationMs,
        total: results.length,
        validCount: valid.length,
        riskyCount: risky.length,
        invalidCount: invalid.length,
        valid,
        risky,
        invalid,
        results
      });
    }

    return NextResponse.json(
      { error: "Provide either an 'email' string or an 'emails' array in request body" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Verify email API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify email address" },
      { status: 500 }
    );
  }
}
