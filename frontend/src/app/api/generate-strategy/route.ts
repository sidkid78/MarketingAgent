import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AzureOpenAI } from "openai"; // NEW IMPORT

// Define a schema for the expected request body
const strategyRequestSchema = z.object({
  goals: z.array(z.string()).nonempty("Goals cannot be empty."),
  platforms: z.array(z.string()).nonempty("Platforms cannot be empty."),
  demographics: z.object({
    age_range: z.array(z.string()).optional(), // Made optional to align with potential user inputs
    gender: z.array(z.string()).optional(),    // Made optional
    location: z.string().optional(),           // Made optional
    language: z.string().optional(),
  }),
  brand_offer_details: z.string().min(1, "Brand/offer details cannot be empty."),
  campaign_budget: z.number().optional(),
  kpis: z.array(z.string()).optional(),
  // website_url: z.string().url().optional(), // Consider adding if available from input
});

type StrategyInput = z.infer<typeof strategyRequestSchema>;

// Interface for the output structure of a single strategy
export interface StrategyOutput {
  goal: string;
  platform: string;
  strategy_title: string;
  summary: string;
  recommendations: string[];
  rationale: string;
  kpis: string[];
}

// Initialize Azure OpenAI client (using hardcoded values for now, as in content-ideas)
const azureOpenai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY, // Reverted to env var
  endpoint: process.env.AZURE_OPENAI_ENDPOINT, // Reverted to env var
  apiVersion: "2025-03-01-preview", // This was previously hardcoded and seems fine
  // Note: The openai-node SDK for Azure doesn't typically use defaultHeaders for the API key here,
  // it's handled by the apiKey parameter directly when using AzureOpenAI.
});

// Helper to format demographic information for the prompt
function formatDemographicsForPrompt(demo: StrategyInput['demographics']): string {
  const parts = [];
  if (demo?.age_range?.length) parts.push(`Target ages: ${demo.age_range.join(', ')}`);
  if (demo?.gender?.length) parts.push(`Target genders: ${demo.gender.join(', ')}`);
  if (demo?.location) parts.push(`Location: ${demo.location}`);
  if (demo?.language) parts.push(`Language: ${demo.language}`);
  return parts.length > 0 ? `Demographics: ${parts.join('; ')}.` : "No specific demographic details provided.";
}

// Helper to construct the prompt for OpenAI strategy generation
function constructStrategyPrompt(input: StrategyInput): string {
  const { goals, platforms, demographics, brand_offer_details, campaign_budget, kpis } = input;

  const demographicInfo = formatDemographicsForPrompt(demographics);
  const budgetInfo = campaign_budget ? `The campaign has an approximate budget of $${campaign_budget}.` : "No specific budget provided.";
  const kpiInfo = kpis && kpis.length > 0 ? `The user is particularly interested in tracking these KPIs: ${kpis.join(', ')}.` : "No specific KPIs were highlighted by the user, focus on standard KPIs for the goals.";

  return `
You are an expert marketing strategist AI. Your task is to generate a detailed and actionable marketing strategy for EACH of the specified platform and goal combinations.

Campaign Context:
- Brand/Offer: "${brand_offer_details}"
- ${demographicInfo}
- ${budgetInfo}
- ${kpiInfo}

Generate a strategy for EACH of the following platform and goal combinations:
${platforms.map(platform => goals.map(goal => `- Platform: ${platform}, Goal: ${goal.replace(/_/g, ' ')}`).join('\n')).join('\n')}

For each strategy, provide the following information:
1.  "goal": The specific marketing goal (e.g., "sales_conversions", "brand_awareness").
2.  "platform": The specific platform (e.g., "facebook", "pinterest").
3.  "strategy_title": A concise and descriptive title for the strategy (e.g., "High-Conversion Pinterest Campaign for Artisanal Jewelry").
4.  "summary": A brief summary (2-3 sentences) of the overall approach for this platform and goal.
5.  "recommendations": An array of 3-5 specific, actionable recommendations. These should cover aspects like:
    - Creative direction (e.g., "Utilize high-quality video ads showcasing product usage.")
    - Ad formats (e.g., "Focus on Carousel ads and Collection ads.")
    - Targeting suggestions (e.g., "Target users interested in 'home decor' and 'DIY crafts', aged 25-55.")
    - Bidding/Budgeting tips (if applicable, e.g., "Allocate 60% of the platform budget to top-performing ad sets after an initial testing phase.")
    - Call to Action (CTA) advice (e.g., "Use clear CTAs like 'Shop Now' or 'Learn More'.")
6.  "rationale": A brief explanation (1-2 sentences) of why this strategy is well-suited for the given context, platform, and goal.
7.  "kpis": An array of 2-3 key performance indicators (KPIs) that are most relevant for measuring the success of this specific strategy (e.g., ["ROAS", "Conversion Rate", "Average Order Value"]).

IMPORTANT: Respond ONLY with a single valid JSON object.
This object MUST have a top-level key named "campaign_strategies".
The value of the "campaign_strategies" key MUST be an array of strategy objects. Each object in this array must precisely follow the structure detailed above (goal, platform, strategy_title, summary, recommendations, rationale, kpis).
Do NOT include any explanatory text, greetings, apologies, or any other content outside of this single JSON object.
Ensure all string values within the JSON are properly escaped and that the entire JSON object is complete and syntactically correct.

Example of the entire JSON object structure:
{
  "campaign_strategies": [
    {
      "goal": "sales_conversions",
      "platform": "pinterest",
      "strategy_title": "Pinterest Promoted Pins for Direct Sales",
      "summary": "Leverage Pinterest's visual discovery nature with compelling Promoted Pins that lead directly to product pages. Focus on high-quality imagery and clear pricing.",
      "recommendations": [
        "Use vertical pins optimized for mobile viewing.",
        "Create boards themed around product use-cases and inspirations.",
        "Target users based on their search terms, saved pins, and interests related to '${brand_offer_details}'.",
        "Implement Rich Pins to automatically sync product information like price and availability.",
        "A/B test different pin descriptions and CTAs to optimize click-through and conversion rates."
      ],
      "rationale": "Pinterest users often have high purchase intent, making it ideal for driving sales, especially for visually appealing products or services.",
      "kpis": ["ROAS", "CPA", "Conversion Rate"]
    }
    // ... more strategy objects for other platform/goal combinations as requested ...
  ]
}

Now, generate the marketing strategies based on the provided campaign context.
`;
}

// Main handler
export async function POST(req: NextRequest) {
  // Environment variable check
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.error("Azure OpenAI API key or endpoint is not configured in environment variables.");
    return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsedBody = strategyRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("Invalid input for /api/generate-strategy:", parsedBody.error.errors);
      return NextResponse.json({ error: "Invalid input", details: parsedBody.error.errors }, { status: 400 });
    }

    const inputData = parsedBody.data;
    const prompt = constructStrategyPrompt(inputData);

    console.log("Generated prompt for /api/generate-strategy:", prompt); // For debugging

    const completion = await azureOpenai.chat.completions.create({
      model: "gpt-4.1", // User states this is the deployment name, or it's a generally available model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6, // Slightly lower for more focused, less wildly creative strategies
      max_tokens: 4096, // Increased to accommodate potentially multiple detailed strategies
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error("AI did not return a response for /api/generate-strategy. Completion:", completion);
      return NextResponse.json({ error: "AI failed to generate marketing strategies." }, { status: 500 });
    }

    console.log("Raw AI response for /api/generate-strategy:", aiResponse); // For debugging

    try {
      let parsedJsonResponse: unknown;
      try {
        parsedJsonResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON for /api/generate-strategy:", aiResponse, parseError);
        const errorDetail = parseError instanceof Error ? parseError.message : "Unknown JSON parsing error";
        throw new Error(`AI response was not valid JSON. Details: ${errorDetail}`);
      }

      let strategiesResult: StrategyOutput[];

      if (typeof parsedJsonResponse === 'object' && parsedJsonResponse !== null && 'campaign_strategies' in parsedJsonResponse) {
        const campaignData = (parsedJsonResponse as Record<string, unknown>).campaign_strategies;
        if (Array.isArray(campaignData)) {
          // Basic validation of the array structure
          strategiesResult = campaignData.filter(item => 
            typeof item === 'object' && item !== null &&
            'goal' in item && typeof item.goal === 'string' &&
            'platform' in item && typeof item.platform === 'string' &&
            'strategy_title' in item && typeof item.strategy_title === 'string' &&
            'summary' in item && typeof item.summary === 'string' &&
            'recommendations' in item && Array.isArray(item.recommendations) &&
            'rationale' in item && typeof item.rationale === 'string' &&
            'kpis' in item && Array.isArray(item.kpis)
          ) as StrategyOutput[];

          if (strategiesResult.length !== campaignData.length) {
            console.warn("Some items in 'campaign_strategies' array did not conform to StrategyOutput structure and were filtered out.");
          }
          if (strategiesResult.length === 0 && campaignData.length > 0) {
             throw new Error("AI response's 'campaign_strategies' array contained items, but none matched the required strategy structure.");
          }

        } else {
          console.error("AI response's 'campaign_strategies' key did not contain an array for /api/generate-strategy:", campaignData);
          throw new Error("AI response structure error: 'campaign_strategies' is not an array.");
        }
      } else {
        console.error("AI response was not an object with 'campaign_strategies' key for /api/generate-strategy:", parsedJsonResponse);
        throw new Error("AI response JSON structure not recognized. Expected object with 'campaign_strategies'.");
      }
      
      if (strategiesResult.length === 0 && (inputData.goals.length * inputData.platforms.length) > 0) {
        // This case means the AI returned an empty array or all items were filtered out,
        // but strategies were expected.
        console.warn("AI returned no valid strategies, though input requested them for /api/generate-strategy. Returning empty array.");
        // It might be better to throw an error here or return a specific message
        // For now, return empty to match old behavior of defaultStrategy if no rules found.
      }

      return NextResponse.json({ strategies: strategiesResult });

    } catch (e: unknown) {
      console.error("Error processing AI JSON response for /api/generate-strategy:", e, "Raw AI response:", aiResponse);
      const errorMessage = e instanceof Error ? e.message : "Unknown parsing error";
      return NextResponse.json({ error: "Failed to parse marketing strategies from AI.", details: errorMessage, rawResponse: aiResponse }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error in /api/generate-strategy POST handler:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const clientErrorMessage = errorMessage.includes("Azure OpenAI") ? "Error communicating with AI service for strategy generation." : "Failed to generate marketing strategies.";
    return NextResponse.json({ error: clientErrorMessage, details: errorMessage }, { status: 500 });
  }
}