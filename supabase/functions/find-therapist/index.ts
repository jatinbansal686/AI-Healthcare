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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { inquiryId } = await req.json();
    if (!inquiryId) {
      return new Response(JSON.stringify({ error: "inquiryId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inquiry, error: iErr } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", inquiryId)
      .eq("patient_id", user.id)
      .single();

    if (iErr || !inquiry) {
      return new Response(JSON.stringify({ error: "Inquiry not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      "Matching inquiry:",
      JSON.stringify({
        specialty: inquiry.extracted_specialty,
        insurance: inquiry.insurance_info,
        language: inquiry.preferred_language,
        gender: inquiry.preferred_gender,
      }),
    );

    // Progressive relaxation — try strictest first, relax one filter at a time
    const attempts = [
      // Attempt 1: all filters
      {
        specialty: inquiry.extracted_specialty,
        insurance: inquiry.insurance_info,
        language: inquiry.preferred_language,
        gender: inquiry.preferred_gender,
      },
      // Attempt 2: drop gender
      {
        specialty: inquiry.extracted_specialty,
        insurance: inquiry.insurance_info,
        language: inquiry.preferred_language,
        gender: null,
      },
      // Attempt 3: drop language + gender
      {
        specialty: inquiry.extracted_specialty,
        insurance: inquiry.insurance_info,
        language: null,
        gender: null,
      },
      // Attempt 4: drop insurance
      {
        specialty: inquiry.extracted_specialty,
        insurance: null,
        language: null,
        gender: null,
      },
    ];

    let matches: any[] = [];

    for (const attempt of attempts) {
      matches = await queryTherapists(supabase, attempt);
      if (matches.length > 0) {
        console.log(`Match found with filters:`, JSON.stringify(attempt));
        break;
      }
    }

    // Last resort — any active therapist
    if (matches.length === 0) {
      console.log("Fallback: returning any active therapists");
      const { data } = await supabase
        .from("therapists")
        .select("*")
        .eq("is_active", true)
        .limit(5);
      matches = data ?? [];
    }

    // Update inquiry with best match
    if (matches.length > 0) {
      await supabase
        .from("inquiries")
        .update({ matched_therapist_id: matches[0].id, status: "matched" })
        .eq("id", inquiryId);
    } else {
      await supabase
        .from("inquiries")
        .update({ status: "failed" })
        .eq("id", inquiryId);
    }

    console.log(`Returning ${matches.length} matches`);

    return new Response(JSON.stringify({ matches, total: matches.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("find-therapist error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function queryTherapists(
  supabase: any,
  filters: {
    specialty: string | null;
    insurance: string | null;
    language: string | null;
    gender: string | null;
  },
): Promise<any[]> {
  let q = supabase.from("therapists").select("*").eq("is_active", true);

  if (filters.specialty?.trim()) {
    q = q.contains("specialties", [filters.specialty.trim().toLowerCase()]);
  }
  if (
    filters.insurance?.trim() &&
    filters.insurance.toLowerCase() !== "unknown"
  ) {
    q = q.contains("accepted_insurance", [
      filters.insurance.trim().toLowerCase(),
    ]);
  }
  if (
    filters.language?.trim() &&
    !["any", "unknown"].includes(filters.language.toLowerCase())
  ) {
    q = q.contains("languages", [filters.language.trim()]);
  }
  if (
    filters.gender?.trim() &&
    !["any", "unknown", "no preference"].includes(filters.gender.toLowerCase())
  ) {
    q = q.eq("gender", filters.gender.trim().toLowerCase());
  }

  const { data, error } = await q.limit(5);
  if (error) {
    console.error("queryTherapists DB error:", JSON.stringify(error));
    return [];
  }
  return data ?? [];
}
