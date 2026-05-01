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
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const systemPrompt =
      "You are a professional nutritionist AI. Analyze food images and call the return_nutrition function with precise estimates. List every visible food component separately. If no food is detected, return health_score: 0 and an empty components array.";

    const tool = {
      type: "function",
      function: {
        name: "return_nutrition",
        description: "Return structured nutrition analysis of the food image.",
        parameters: {
          type: "object",
          properties: {
            dish_name: { type: "string" },
            meal_type: {
              type: "string",
              enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
            },
            components: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  emoji: { type: "string", description: "Single food emoji" },
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
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this food image and return precise nutrition data using the return_nutrition function.",
                },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
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
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
