// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {

  // ✅ HANDLE PREFLIGHT REQUEST
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { appointmentId, action } = await req.json()

    const { data: apt } = await supabase
      .from('appointments')
      .select('*, therapist:therapists(name), patient:user_profiles(full_name, email)')
      .eq('id', appointmentId)
      .single()

    if (!apt) {
      return new Response('Not found', { status: 404, headers: corsHeaders })
    }

    const patientEmail  = apt.patient?.email
    const patientName   = apt.patient?.full_name ?? 'Patient'
    const therapistName = apt.therapist?.name ?? 'Your therapist'

    const startDate     = new Date(apt.start_time)
    const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const formattedTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    if (!patientEmail) {
      return new Response('No patient email', { status: 200, headers: corsHeaders })
    }

    const key  = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('FROM_EMAIL') ?? 'noreply@healthscheduler.app'

    if (!key) {
      return new Response('No email key', { status: 200, headers: corsHeaders })
    }

    const isAccept = action === 'accept'

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `HealthScheduler <${from}>`,
        to: [patientEmail],
        subject: isAccept ? '✅ Your appointment is confirmed!' : 'Update on your appointment request',
        html: isAccept
          ? `<p>Hi ${patientName}, ${therapistName} confirmed your session on ${formattedDate} at ${formattedTime}</p>`
          : `<p>Hi ${patientName}, ${therapistName} declined your request for ${formattedDate} at ${formattedTime}</p>`
      })
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    })
  }
})