// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are a compassionate, professional healthcare scheduling assistant.
Your ONLY job is to help patients find the right therapist and book an appointment.

You must gather ALL of the following through natural conversation:
1. Main problem or symptoms (anxiety, depression, trauma, OCD, grief, stress, relationships, etc.)
2. Insurance provider (Aetna, BCBS, Cigna, United, Humana, Medicaid, Medicare, self_pay)
3. Preferred schedule (weekday mornings, evenings, weekends, flexible, etc.)
4. Preferred language for sessions (default English if not mentioned)
5. Preferred therapist gender (male, female, non-binary, or any/no preference)

Rules:
- Ask ONE question at a time. Be warm and empathetic.
- Never diagnose or give medical advice.
- Acknowledge feelings before moving to the next question.
- Once you have ALL 5 pieces of info, write a warm closing message then on a NEW LINE append this JSON block EXACTLY:
{"problem":"...","specialty_needed":"...","requested_schedule":"...","insurance_info":"...","preferred_language":"English","preferred_gender":"any","is_complete":true}

specialty_needed must be one of: anxiety, depression, trauma, ptsd, ocd, grief, family_therapy, adolescents, relationships, stress, mens_health, substance_abuse, identity, cultural_adjustment, mindfulness, anger_management

If you do NOT yet have all 5 pieces, end with:
{"is_complete":false}

IMPORTANT: The JSON must always be on its own line at the very end of your response.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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

    const body = await req.json();
    const { message, inquiryId } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load full chat history from DB — DB is single source of truth
    const { data: dbMessages } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: true })
      .limit(40);

    const history = dbMessages ?? [];

    // Build Gemini contents array
    // Gemini uses 'model' not 'assistant'
    const geminiContents = [
      ...history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY secret is not set in Supabase Edge Function secrets",
      );
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH",
            },
          ],
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini ${geminiRes.status}:`, errText);
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`);
    }

    const geminiData = await geminiRes.json();

    if (!geminiData.candidates?.length) {
      console.error("Gemini no candidates:", JSON.stringify(geminiData));
      throw new Error(
        "Gemini returned no response — message may have been blocked",
      );
    }

    const rawReply: string =
      geminiData.candidates[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawReply) throw new Error("Gemini response text was empty");

    // Extract JSON block — always the last {...} in the reply
    let extraction: Record<string, unknown> | null = null;
    const allJsonMatches = [...rawReply.matchAll(/\{[^{}]*\}/g)];
    for (let i = allJsonMatches.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(allJsonMatches[i][0]);
        if ("is_complete" in parsed) {
          extraction = parsed;
          break;
        }
      } catch {
        // not valid JSON
      }
    }

    // Strip JSON block from display text
    const displayReply =
      rawReply.replace(/\n?\{[^{}]*"is_complete"[^{}]*\}\s*$/m, "").trim() ||
      "I've gathered everything I need. Let me find the best therapist for you!";

    // Save both messages to DB (non-fatal if fails)
    const saveResult = await supabase.from("chat_messages").insert([
      {
        patient_id: user.id,
        inquiry_id: inquiryId ?? null,
        role: "user",
        content: message,
      },
      {
        patient_id: user.id,
        inquiry_id: inquiryId ?? null,
        role: "assistant",
        content: rawReply, // store full reply including JSON for history
      },
    ]);
    if (saveResult.error) {
      console.error("DB save error (non-fatal):", saveResult.error);
    }

    // If extraction complete, save/update inquiry
    let currentInquiryId = inquiryId ?? null;

    if (extraction?.is_complete === true) {
      const inquiryPayload = {
        patient_id: user.id,
        problem_description: extraction.problem as string,
        requested_schedule: extraction.requested_schedule as string,
        insurance_info: (extraction.insurance_info as string)?.toLowerCase(),
        preferred_language: extraction.preferred_language as string,
        preferred_gender: (
          extraction.preferred_gender as string
        )?.toLowerCase(),
        extracted_specialty: (
          extraction.specialty_needed as string
        )?.toLowerCase(),
        ai_summary: JSON.stringify(extraction),
        status: "pending",
        updated_at: new Date().toISOString(),
      };

      if (inquiryId) {
        await supabase
          .from("inquiries")
          .update(inquiryPayload)
          .eq("id", inquiryId);
      } else {
        const { data: newInquiry, error: iErr } = await supabase
          .from("inquiries")
          .insert(inquiryPayload)
          .select("id")
          .single();

        if (iErr) {
          console.error("Inquiry insert error:", iErr);
        } else {
          currentInquiryId = newInquiry.id;
          // backfill inquiry_id on the messages we just saved
          await supabase
            .from("chat_messages")
            .update({ inquiry_id: currentInquiryId })
            .eq("patient_id", user.id)
            .is("inquiry_id", null);
        }
      }
    }

    return new Response(
      JSON.stringify({
        reply: displayReply,
        extraction,
        inquiryId: currentInquiryId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("handle-chat fatal:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
