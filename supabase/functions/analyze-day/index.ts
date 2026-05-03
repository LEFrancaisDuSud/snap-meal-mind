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

    const { meals, targets } = await req.json();
    if (!Array.isArray(meals)) {
      return new Response(JSON.stringify({ error: "meals required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const totals = meals.reduce(
      (a: any, m: any) => ({
        cal: a.cal + Number(m.calories || 0),
        p: a.p + Number(m.protein_g || 0),
        c: a.c + Number(m.carbs_g || 0),
        f: a.f + Number(m.fat_g || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 },
    );

    const tool = {
      type: "function",
      function: {
        name: "return_day_analysis",
        description: "Return a short French nutrition balance analysis.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "1-3 sentences in French, friendly, actionable. Mention what's good and what to improve.",
            },
            verdict: {
              type: "string",
              enum: ["good", "warn", "bad"],
            },
          },
          required: ["summary", "verdict"],
          additionalProperties: false,
        },
      },
    };

    const userPrompt = `Cibles quotidiennes:
- Calories: ${targets?.calories ?? "n/a"} kcal
- Protéines: ${targets?.protein_g ?? "n/a"} g
- Glucides: ${targets?.carbs_g ?? "n/a"} g
- Lipides: ${targets?.fat_g ?? "n/a"} g

Repas consommés (totaux: ${Math.round(totals.cal)} kcal, P=${totals.p.toFixed(0)}g, G=${totals.c.toFixed(0)}g, L=${totals.f.toFixed(0)}g):
${meals
  .map(
    (m: any) =>
      `- ${m.meal_type}: ${m.dish_name} — ${m.calories} kcal, P${m.protein_g}g G${m.carbs_g}g L${m.fat_g}g`,
  )
  .join("\n")}`;

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
                "Tu es un nutritionniste IA. Réponds en français, ton bienveillant, court et actionnable.",
            },
            { role: "user", content: userPrompt },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "return_day_analysis" },
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
    const parsed = JSON.parse(args);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-day error:", e);
    return new Response(
      JSON.stringify({ error: "Analyse impossible. Réessaie." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
