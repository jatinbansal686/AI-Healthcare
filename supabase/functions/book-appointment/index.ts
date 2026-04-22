// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action"); // 'accept' | 'reject'

  // Therapist clicking accept/reject from email link — no auth needed
  if (action === "accept" || action === "reject") {
    return handleTherapistResponse(supabase, url, action);
  }

  // Patient booking request — needs auth
  try {
    // ✅ THIS LINE WAS MISSING — caused "authHeader is not defined"
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      inquiryId,
      therapistId,
      startTime,
      endTime,
      patientName,
      patientEmail,
    } = await req.json();

    if (!inquiryId || !therapistId || !startTime || !endTime) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: inquiryId, therapistId, startTime, endTime",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch therapist — no join to avoid PGRST200
    const { data: therapist, error: tErr } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", therapistId)
      .single();

    if (tErr || !therapist) {
      console.error("Therapist fetch error:", JSON.stringify(tErr));
      return new Response(JSON.stringify({ error: "Therapist not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get therapist email via separate profile query
    let therapistEmail: string | null = therapist.google_calendar_id ?? null;

    if (therapist.user_id) {
      const { data: therapistProfile } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("id", therapist.user_id)
        .single();

      if (therapistProfile?.email) {
        therapistEmail = therapistProfile.email;
      }
    }

    if (!therapistEmail) {
      console.warn(
        `Therapist ${therapist.name} has no email — will skip therapist notification`,
      );
    }

    // Generate secure confirmation token
    const confirmationToken = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

    // Save appointment to DB
    const { data: appointment, error: aptErr } = await supabase
      .from("appointments")
      .insert({
        inquiry_id: inquiryId,
        therapist_id: therapistId,
        patient_id: user.id,
        start_time: startTime,
        end_time: endTime,
        status: "confirmed",
        confirmation_status: "pending",
        confirmation_token: confirmationToken,
      })
      .select()
      .single();

    if (aptErr || !appointment) {
      console.error("Appointment insert error:", JSON.stringify(aptErr));
      return new Response(
        JSON.stringify({
          error: "Failed to save appointment",
          detail: aptErr?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Appointment saved:", appointment.id);

    // Update inquiry status
    await supabase
      .from("inquiries")
      .update({ status: "awaiting_booking" })
      .eq("id", inquiryId);

    // Build accept / reject links
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/book-appointment`;
    const acceptUrl = `${fnUrl}?action=accept&token=${confirmationToken}`;
    const rejectUrl = `${fnUrl}?action=reject&token=${confirmationToken}`;

    const startDate = new Date(startTime);
    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Email therapist
    if (therapistEmail) {
      await sendEmail({
        to: therapistEmail,
        subject: `New appointment request from ${patientName}`,
        html: therapistRequestEmail({
          therapistName: therapist.name,
          patientName,
          patientEmail,
          formattedDate,
          formattedTime,
          acceptUrl,
          rejectUrl,
        }),
      });
      console.log("Therapist email sent to:", therapistEmail);
    }

    // Email patient
    await sendEmail({
      to: patientEmail,
      subject: "Your appointment request has been sent",
      html: patientPendingEmail({
        patientName,
        therapistName: therapist.name,
        formattedDate,
        formattedTime,
      }),
    });

    return new Response(
      JSON.stringify({
        appointment,
        message: "Appointment request saved and sent to therapist.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("book-appointment error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Therapist accept / reject handler ────────────────────────────────────────
async function handleTherapistResponse(
  supabase: any,
  url: URL,
  action: "accept" | "reject",
): Promise<Response> {
  const token = url.searchParams.get("token");
  const htmlHeader = { "Content-Type": "text/html; charset=utf-8" };

  if (!token) {
    return new Response(errorPage("Invalid link — token is missing."), {
      status: 400,
      headers: htmlHeader,
    });
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      therapist:therapists(name, google_calendar_id, google_refresh_token),
      patient:user_profiles(full_name, email)
    `,
    )
    .eq("confirmation_token", token)
    .single();

  if (error || !appointment) {
    return new Response(errorPage("Invalid or expired link."), {
      status: 404,
      headers: htmlHeader,
    });
  }

  if (appointment.confirmation_status !== "pending") {
    return new Response(
      successPage(
        `Already ${appointment.confirmation_status}`,
        `This appointment has already been ${appointment.confirmation_status}.`,
      ),
      { status: 200, headers: htmlHeader },
    );
  }

  const patientEmail = appointment.patient?.email ?? null;
  const patientName = appointment.patient?.full_name ?? "the patient";
  const therapistName = appointment.therapist?.name ?? "the therapist";

  const startDate = new Date(appointment.start_time);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (action === "reject") {
    await supabase
      .from("appointments")
      .update({ confirmation_status: "rejected", status: "cancelled" })
      .eq("id", appointment.id);

    await supabase
      .from("inquiries")
      .update({ status: "matched" })
      .eq("id", appointment.inquiry_id);

    if (patientEmail) {
      await sendEmail({
        to: patientEmail,
        subject: "Update on your appointment request",
        html: patientRejectionEmail({
          patientName,
          therapistName,
          formattedDate,
          formattedTime,
        }),
      });
    }

    return new Response(
      successPage(
        "Appointment Declined",
        `You have declined the request from ${patientName}. They have been notified.`,
      ),
      { status: 200, headers: htmlHeader },
    );
  }

  // Accept — try Google Calendar (non-fatal if fails)
  let calendarEventId: string | null = null;

  if (
    appointment.therapist?.google_refresh_token &&
    appointment.therapist?.google_calendar_id
  ) {
    try {
      calendarEventId = await createCalendarEvent({
        refreshToken: appointment.therapist.google_refresh_token,
        calendarId: appointment.therapist.google_calendar_id,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        patientName,
        patientEmail: patientEmail ?? "unknown@email.com",
        therapistName,
      });
      console.log("Calendar event created:", calendarEventId);
    } catch (calErr) {
      console.error("Calendar error (non-fatal):", calErr);
    }
  } else {
    console.warn("Therapist has no Google Calendar connected — skipping");
  }

  await supabase
    .from("appointments")
    .update({
      confirmation_status: "accepted",
      google_calendar_event_id: calendarEventId,
    })
    .eq("id", appointment.id);

  await supabase
    .from("inquiries")
    .update({ status: "scheduled" })
    .eq("id", appointment.inquiry_id);

  if (patientEmail) {
    await sendEmail({
      to: patientEmail,
      subject: "✅ Your appointment is confirmed!",
      html: patientConfirmationEmail({
        patientName,
        therapistName,
        formattedDate,
        formattedTime,
        calendarLinked: !!calendarEventId,
      }),
    });
  }

  return new Response(
    successPage(
      "Appointment Confirmed! ✅",
      `You accepted the appointment with ${patientName}. A calendar invite has been created.`,
    ),
    { status: 200, headers: htmlHeader },
  );
}

// ── Google Calendar ───────────────────────────────────────────────────────────
async function createCalendarEvent(opts: {
  refreshToken: string;
  calendarId: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientEmail: string;
  therapistName: string;
}): Promise<string> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: opts.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(tokenData)}`);
  }

  const eventRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(opts.calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Therapy Session — ${opts.patientName}`,
        description: "Scheduled via HealthScheduler",
        start: { dateTime: opts.startTime, timeZone: "America/Chicago" },
        end: { dateTime: opts.endTime, timeZone: "America/Chicago" },
        attendees: [
          { email: opts.patientEmail, displayName: opts.patientName },
        ],
        sendUpdates: "all",
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 1440 },
            { method: "popup", minutes: 30 },
          ],
        },
      }),
    },
  );
  const eventData = await eventRes.json();
  if (!eventData.id) {
    throw new Error(`Calendar event failed: ${JSON.stringify(eventData)}`);
  }
  return eventData.id;
}

// ── Resend email ──────────────────────────────────────────────────────────────
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL") ?? "noreply@healthscheduler.app";

  if (!key) {
    console.warn("RESEND_API_KEY not set — skipping email to", opts.to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `HealthScheduler <${from}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    console.error("Resend failed:", await res.text());
  }
}

// ── Email templates ───────────────────────────────────────────────────────────
function therapistRequestEmail(o: {
  therapistName: string;
  patientName: string;
  patientEmail: string;
  formattedDate: string;
  formattedTime: string;
  acceptUrl: string;
  rejectUrl: string;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2563eb">New Appointment Request</h2>
<p>Hello ${o.therapistName},</p>
<p><strong>${o.patientName}</strong> (${o.patientEmail}) has requested a therapy session.</p>
<table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%">
  <tr><td style="color:#64748b;padding:6px 0">Date</td><td style="font-weight:600">${o.formattedDate}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Time</td><td style="font-weight:600">${o.formattedTime}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Duration</td><td style="font-weight:600">1 hour</td></tr>
</table>
<div style="margin-top:24px">
  <a href="${o.acceptUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;margin-right:12px">✅ Accept</a>
  <a href="${o.rejectUrl}" style="background:#dc2626;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">❌ Decline</a>
</div>
<p style="margin-top:20px;font-size:12px;color:#94a3b8">Each link can only be used once.</p>
</body></html>`;
}

function patientPendingEmail(o: {
  patientName: string;
  therapistName: string;
  formattedDate: string;
  formattedTime: string;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2563eb">Request Sent!</h2>
<p>Hi ${o.patientName}, your request has been sent to <strong>${o.therapistName}</strong>.</p>
<table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%">
  <tr><td style="color:#64748b;padding:6px 0">Therapist</td><td style="font-weight:600">${o.therapistName}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Date</td><td style="font-weight:600">${o.formattedDate}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Time</td><td style="font-weight:600">${o.formattedTime}</td></tr>
</table>
<p style="color:#64748b;font-size:14px;margin-top:16px">You'll receive an email once they respond.</p>
</body></html>`;
}

function patientConfirmationEmail(o: {
  patientName: string;
  therapistName: string;
  formattedDate: string;
  formattedTime: string;
  calendarLinked: boolean;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;margin-bottom:24px">
  <h2 style="color:#15803d;margin:0">✅ Appointment Confirmed!</h2>
</div>
<p>Hi ${o.patientName}, <strong>${o.therapistName}</strong> has confirmed your session.</p>
<table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%">
  <tr><td style="color:#64748b;padding:6px 0">Therapist</td><td style="font-weight:600">${o.therapistName}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Date</td><td style="font-weight:600">${o.formattedDate}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Time</td><td style="font-weight:600">${o.formattedTime}</td></tr>
  <tr><td style="color:#64748b;padding:6px 0">Duration</td><td style="font-weight:600">1 hour</td></tr>
  ${o.calendarLinked ? '<tr><td style="color:#64748b;padding:6px 0">Calendar</td><td style="font-weight:600">📅 Added to Google Calendar</td></tr>' : ""}
</table>
</body></html>`;
}

function patientRejectionEmail(o: {
  patientName: string;
  therapistName: string;
  formattedDate: string;
  formattedTime: string;
}) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin-bottom:24px">
  <h2 style="color:#b91c1c;margin:0">Appointment Update</h2>
</div>
<p>Hi ${o.patientName}, unfortunately <strong>${o.therapistName}</strong> is unable to take your request for ${o.formattedDate} at ${o.formattedTime}.</p>
<p>Please return to the app to choose another therapist or time.</p>
</body></html>`;
}

function successPage(title: string, message: string) {
  return `<!DOCTYPE html><html><head><title>${title}</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px;text-align:center">
  <div style="font-size:52px">${title.includes("Confirmed") ? "✅" : "❌"}</div>
  <h2>${title}</h2>
  <p style="color:#64748b">${message}</p>
  <p style="color:#94a3b8;font-size:13px;margin-top:32px">You can close this window.</p>
</body></html>`;
}

function errorPage(message: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px;text-align:center">
<div style="font-size:52px">⚠️</div>
<h2>Error</h2>
<p style="color:#64748b">${message}</p>
</body></html>`;
}
