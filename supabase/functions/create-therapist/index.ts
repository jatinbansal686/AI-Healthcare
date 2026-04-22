// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is admin
    const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      email,
      password,
      name,
      bio,
      photo_url,
      gender,
      specialties,
      accepted_insurance,
      languages,
      google_calendar_id,
    } = await req.json()

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'email, password, and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Create Supabase Auth user
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so therapist can login immediately
      user_metadata: { full_name: name },
    })

    if (createErr || !newUser.user) {
      console.error('Auth user creation error:', createErr)
      return new Response(
        JSON.stringify({ error: createErr?.message ?? 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = newUser.user.id

    // Step 2: Set role to therapist in user_profiles
    // (trigger already created the profile row on signup)
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({ role: 'therapist', full_name: name, email })
      .eq('id', newUserId)

    if (profileErr) {
      console.error('Profile update error:', profileErr)
      // Don't block — profile may not exist yet if trigger is slow
      await supabase.from('user_profiles').upsert({
        id:         newUserId,
        role:       'therapist',
        full_name:  name,
        email,
      })
    }

    // Step 3: Create therapist record linked to this user
    const { data: therapist, error: therapistErr } = await supabase
      .from('therapists')
      .insert({
        user_id:           newUserId,
        name,
        bio:               bio ?? null,
        photo_url:         photo_url ?? null,
        gender:            gender ?? 'prefer_not_to_say',
        specialties:       (specialties ?? []).map((s: string) => s.toLowerCase()),
        accepted_insurance: (accepted_insurance ?? []).map((i: string) => i.toLowerCase()),
        languages:         languages ?? ['English'],
        google_calendar_id: google_calendar_id ?? null,
        is_active:         true,
      })
      .select()
      .single()

    if (therapistErr || !therapist) {
      console.error('Therapist insert error:', therapistErr)
      // Rollback: delete the auth user we just created
      await supabase.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: 'Failed to create therapist profile', detail: therapistErr?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Therapist created: ${name} (${email}) — user_id: ${newUserId}`)

    return new Response(
      JSON.stringify({
        therapist,
        message: `Therapist account created. They can login with email: ${email}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('create-therapist error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})