// // @ts-nocheck
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// }

// Deno.serve(async (req: Request) => {

//   // ✅ HANDLE PREFLIGHT REQUEST
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders })
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL')!,
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
//     )

//     const { appointmentId, action } = await req.json()

//     const { data: apt } = await fetch(
//   `${SUPABASE_URL}/functions/v1/book-appointment?action=${action}&token=${appointment.confirmation_token}`
// );
//     // await supabase
//     //   .from('appointments')
//     //   .select('*, therapist:therapists(name), patient:user_profiles(full_name, email)')
//     //   .eq('id', appointmentId)
//     //   .single()

//     // if (!apt) {
//     //   return new Response('Not found', { status: 404, headers: corsHeaders })
//     // }

//     const patientEmail  = apt.patient?.email
//     const patientName   = apt.patient?.full_name ?? 'Patient'
//     const therapistName = apt.therapist?.name ?? 'Your therapist'

//     const startDate     = new Date(apt.start_time)
//     const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
//     const formattedTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

//     if (!patientEmail) {
//       return new Response('No patient email', { status: 200, headers: corsHeaders })
//     }

//     const key  = Deno.env.get('RESEND_API_KEY')
//     const from = Deno.env.get('FROM_EMAIL') ?? 'noreply@healthscheduler.app'

//     if (!key) {
//       return new Response('No email key', { status: 200, headers: corsHeaders })
//     }

//     const isAccept = action === 'accept'

//     await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${key}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         from: `HealthScheduler <${from}>`,
//         to: [patientEmail],
//         subject: isAccept ? '✅ Your appointment is confirmed!' : 'Update on your appointment request',
//         html: isAccept
//           ? `<p>Hi ${patientName}, ${therapistName} confirmed your session on ${formattedDate} at ${formattedTime}</p>`
//           : `<p>Hi ${patientName}, ${therapistName} declined your request for ${formattedDate} at ${formattedTime}</p>`
//       })
//     })

//     return new Response(JSON.stringify({ ok: true }), {
//       status: 200,
//       headers: {
//         ...corsHeaders,
//         "Content-Type": "application/json"
//       }
//     })

//   } catch (err: unknown) {
//     const msg = err instanceof Error ? err.message : String(err)

//     return new Response(JSON.stringify({ error: msg }), {
//       status: 500,
//       headers: {
//         ...corsHeaders,
//         "Content-Type": "application/json"
//       }
//     })
//   }
// })

// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { appointmentId, action } = await req.json();

    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "Missing appointmentId" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ✅ Fetch appointment (NO JOIN to avoid errors)
    const { data: apt, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error || !apt) {
      console.error("Appointment fetch error:", error);
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // ✅ Fetch patient separately
    const { data: patient } = await supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", apt.patient_id)
      .single();

    // ✅ Fetch therapist separately
    const { data: therapist } = await supabase
      .from("therapists")
      .select("name")
      .eq("id", apt.therapist_id)
      .single();

    const patientEmail = patient?.email;
    const patientName = patient?.full_name ?? "Patient";
    const therapistName = therapist?.name ?? "Your therapist";

    if (!patientEmail) {
      return new Response(JSON.stringify({ message: "No patient email" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const startDate = new Date(apt.start_time);
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

    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("FROM_EMAIL") ?? "noreply@healthscheduler.app";

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const isAccept = action === "accept";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `HealthScheduler <${from}>`,
        to: [patientEmail],
        subject: isAccept
          ? "✅ Your appointment is confirmed!"
          : "Update on your appointment request",
        html: isAccept
          ? `<p>Hi ${patientName}, <strong>${therapistName}</strong> confirmed your session on ${formattedDate} at ${formattedTime}.</p>`
          : `<p>Hi ${patientName}, <strong>${therapistName}</strong> declined your request for ${formattedDate} at ${formattedTime}. Please choose another slot.</p>`,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Email error:", errText);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("notify-patient error:", msg);

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
