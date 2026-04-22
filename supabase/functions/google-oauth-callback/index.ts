// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

Deno.serve(async (req: Request) => {
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // therapist JWT access token

    if (!code || !state) {
      return Response.redirect(
        `${siteUrl}/oauth/callback?error=Missing+code+or+state`,
        302,
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(state);
    if (authError || !user) {
      return Response.redirect(
        `${siteUrl}/oauth/callback?error=Invalid+therapist+session`,
        302,
      );
    }

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.refresh_token) {
      console.error("No refresh_token in response:", JSON.stringify(tokenData));
      return Response.redirect(
        `${siteUrl}/oauth/callback?error=No+refresh+token.+Make+sure+prompt=consent+is+in+the+OAuth+URL`,
        302,
      );
    }

    // Get calendar ID from Google
    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    const calData = await calRes.json();
    const calendarId = calData.id ?? user.email;

    await supabase
      .from("therapists")
      .update({
        google_refresh_token: tokenData.refresh_token,
        google_calendar_id: calendarId,
      })
      .eq("user_id", user.id);

    return Response.redirect(`${siteUrl}/oauth/callback?success=true`, 302);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("OAuth callback error:", msg);
    return Response.redirect(
      `${siteUrl}/oauth/callback?error=${encodeURIComponent(msg)}`,
      302,
    );
  }
});