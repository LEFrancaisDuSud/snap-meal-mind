import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (transcript.length > 2000) {
      return new Response(JSON.stringify({ error: "Transcript too long" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tool = {
      type: "function",
      function: {
        name: "return_nutrition",
        description: "Return structured nutrition analysis from a spoken meal description.",
        parameters: {
          type: "object",
          properties: {
            dish_name: { type: "string", description: "Short French name for the meal" },
            meal_type: {
              type: "string",
              enum: ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"],
            },
            components: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  emoji: { type: "string" },
                  quantity_estimate: { type: "string" },
                  calories: { type: "number" },
                  protein_g: { type: "number" },
                  carbs_g: { type: "number" },
                  fat_g: { type: "number" },
                },
                required: [
                  "name",
                  "emoji",
                  "quantity_estimate",
                  "calories",
                  "protein_g",
                  "carbs_g",
                  "fat_g",
                ],
                additionalProperties: false,
              },
            },
            total_calories: { type: "number" },
            total_protein_g: { type: "number" },
            total_carbs_g: { type: "number" },
            total_fat_g: { type: "number" },
            health_score: { type: "number", minimum: 0, maximum: 10 },
            health_tip: { type: "string" },
          },
          required: [
            "dish_name",
            "meal_type",
            "components",
            "total_calories",
            "total_protein_g",
            "total_carbs_g",
            "total_fat_g",
            "health_score",
            "health_tip",
          ],
          additionalProperties: false,
        },
      },
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Tu es un nutritionniste IA. À partir d'une description vocale en français, identifie les aliments avec emoji et estime calories/macros. Donne des noms français.",
            },
            {
              role: "user",
              content: `Description vocale du repas: « ${transcript} ». Estime les portions raisonnables si non précisées.`,
            },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "return_nutrition" },
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error(`AI gateway ${response.status}`);
    }

    const data = await response.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No structured response");
    return new Response(args, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-voice-meal error:", e);
    return new Response(
      JSON.stringify({ error: "Analyse vocale impossible. Réessaie." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
