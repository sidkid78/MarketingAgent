import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// import OpenAI from "openai"; // OLD IMPORT
import { AzureOpenAI } from "openai"; // NEW IMPORT
// import { Ratelimit } from "@upstash/ratelimit"; // REMOVE
// import { Redis } from "@upstash/redis"; // REMOVE

// Input validation schema
const requestSchema = z.object({
  goals: z.array(z.string()).nonempty("Goals cannot be empty."),
  platforms: z.array(z.string()).nonempty("Platforms cannot be empty."),
  brand_offer_details: z.string().min(10, "Brand/offer details must be at least 10 characters.").max(500),
  demographics: z.object({
    age_range: z.array(z.string()).nonempty("Age range cannot be empty."),
    gender: z.array(z.string()).nonempty("Gender cannot be empty."),
    location: z.string().nonempty("Location cannot be empty."),
    language: z.string().optional(),
  }),
  audience_interests: z.array(z.string()).optional(),
});

export interface ContentIdea {
  headline: string;
  visual_direction: string;
  caption: string;
  cta: string;
  hashtag_suggestions?: string[];
}

export interface ContentIdeaBlock {
  platform: string;
  goal: string;
  ideas: ContentIdea[];
}

// Initialize Azure OpenAI client
// const azureOpenai = new OpenAI({ // OLD CLIENT INITIALIZATION
//   apiKey: "AAImBVT1BB4fgrKXyKnnxM46lRUJ97PLCwJh4gZOwdhnpKM1JzucJQQJ99BCACHYHv6XJ3w3AAAAACOGw5OW", // process.env.AZURE_OPENAI_API_KEY,
//   baseURL: `https://kevin-m8961u8a-eastus2.cognitiveservices.azure.com/openai/deployments/`,//.replace(/\/\/$/, '/'), // `${process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '')}/`,
//   defaultQuery: { "api-version": "2025-03-01-preview" }, // Reverted to user's required api-version
//   defaultHeaders: { "api-key": "AAImBVT1BB4fgrKXyKnnxM46lRUJ97PLCwJh4gZOwdhnpKM1JzucJQQJ99BCACHYHv6XJ3w3AAAAACOGw5OW" }, // process.env.AZURE_OPENAI_API_KEY },
// });

const azureOpenai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2025-03-01-preview",
  // The base URL for chat completions needs to be constructed slightly differently if not using the dedicated endpoint property
  // However, with AzureOpenAI class, just endpoint should suffice for model deployments.
  // We'll let the `model` parameter in create specify the deployment name directly.
});

// Helper to construct the prompt for OpenAI
function constructPrompt(input: z.infer<typeof requestSchema>): string {
  const { goals, platforms, brand_offer_details, demographics, audience_interests } = input;

  const demographicInfo = `Target audience is ${demographics.gender.join('/')} aged ${demographics.age_range.join(', ')} located in ${demographics.location}${demographics.language ? ' who speak ' + demographics.language : ''}.`;
  const interestsInfo = audience_interests && audience_interests.length > 0 ? `They are interested in: ${audience_interests.join(', ')}.` : "No specific interests provided, focus on general appeal based on demographics.";

  return `
You are an expert marketing assistant. Your task is to generate innovative and engaging content ideas for a marketing campaign.
The campaign details are as follows:
- Brand/Offer: "${brand_offer_details}"
- ${demographicInfo}
- ${interestsInfo}

Generate 2-3 unique content ideas for EACH of the following platform and goal combinations:
${platforms.map(platform => goals.map(goal => `- Platform: ${platform}, Goal: ${goal.replace(/_/g, ' ')}`).join('\n')).join('\n')}

For each content idea, provide:
1.  "headline": A catchy headline (max 15 words).
2.  "visual_direction": A brief description of the visual concept (e.g., "Instagram Reel: Busy professional unwinds at home.").
3.  "caption": A compelling caption (max 50 words).
4.  "cta": A clear call to action (e.g., "Watch Demo", "Sign Up Now").
5.  "hashtag_suggestions": An array of 3-5 relevant hashtags (e.g., ["#YogaAtHome", "#WellnessJourney"]).

IMPORTANT: Respond ONLY with a single valid JSON object.
This object MUST have a top-level key named "campaign_content_ideas".
The value of the "campaign_content_ideas" key MUST be an array of content idea blocks.
Each content idea block in the array must follow this structure:
{
  "platform": "string (e.g., instagram)",
  "goal": "string (e.g., brand_awareness)",
  "ideas": [
    {
      "headline": "string",
      "visual_direction": "string",
      "caption": "string",
      "cta": "string",
      "hashtag_suggestions": ["string", "string"]
    }
    // ... more ideas for this platform/goal combination
  ]
}
Do NOT include any explanatory text, greetings, or apologies before or after the JSON output. The entire response must be a single JSON object.
Ensure all string values within the JSON are properly escaped.

Example of the entire JSON object structure:
{
  "campaign_content_ideas": [
    {
      "platform": "instagram",
      "goal": "brand_awareness",
      "ideas": [
        {
          "headline": "Unwind with Our Online Yoga",
          "visual_direction": "Reel: Busy professional transitions to yoga at home.",
          "caption": "Find your peace. Flexible online yoga classes. #OnlineYoga",
          "cta": "Try a Free Class",
          "hashtag_suggestions": ["#HomeYoga", "#Mindfulness", "#Wellness"]
        }
      ]
    },
    {
      "platform": "facebook",
      "goal": "lead_generation",
      "ideas": [ /* ... similar idea structure ... */ ]
    }
    // ... more blocks for other platform/goal combinations
  ]
}
Now, generate the content ideas based on the provided campaign details.
`;
}

export async function POST(req: NextRequest) {
  // Environment variable check
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
    console.error("Azure OpenAI API key, endpoint, or deployment name is not configured.");
    return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsedInput = requestSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json({ error: "Invalid input", details: parsedInput.error.errors }, { status: 400 });
    }

    const prompt = constructPrompt(parsedInput.data);

    const completion = await azureOpenai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4.1", // Reverted to env var, keeping fallback for safety
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000, // Increased max_tokens slightly for potentially larger combined output
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error("AI did not return a response.", completion);
      return NextResponse.json({ error: "AI failed to generate content ideas." }, { status: 500 });
    }

    try {
      let tempParsed: unknown;
      try {
        tempParsed = JSON.parse(aiResponse); // Parse the JSON string once
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", aiResponse, parseError);
        const errorDetail = parseError instanceof Error ? parseError.message : "Unknown JSON parsing error";
        throw new Error(`AI response was not valid JSON. Details: ${errorDetail}`);
      }
      
      let contentIdeasResult: ContentIdeaBlock[];

      // Expect a top-level object with a key "campaign_content_ideas" containing the array
      if (typeof tempParsed === 'object' && tempParsed !== null && 'campaign_content_ideas' in tempParsed) {
        const campaignData = (tempParsed as Record<string, unknown>).campaign_content_ideas;
        if (Array.isArray(campaignData)) {
          contentIdeasResult = campaignData as ContentIdeaBlock[];
        } else {
          console.error("AI response's 'campaign_content_ideas' key did not contain an array:", campaignData);
          throw new Error("AI response structure error: 'campaign_content_ideas' is not an array.");
        }
      } else if (Array.isArray(tempParsed)) {
        // Fallback: if AI somehow ignored the new instruction and returned an array directly
        // (and it's not a single block object that should have been wrapped by previous logic if that was still in place)
        console.warn("AI returned an array directly, expected an object with 'campaign_content_ideas'. Processing as array.");
        contentIdeasResult = tempParsed as ContentIdeaBlock[];
      }
      // Removed the specific handling for a single object here, as the prompt now asks for a wrapper object.
      // If the AI returns a single ContentIdeaBlock object directly, it's now a deviation from the prompt.
      else {
        console.error("AI response was not an object with 'campaign_content_ideas' key, nor a direct array:", tempParsed);
        throw new Error("AI response JSON structure not recognized. Expected object with 'campaign_content_ideas'.");
      }

      // Further validation to ensure contentIdeasResult matches ContentIdeaBlock[]
      if (!Array.isArray(contentIdeasResult) || !contentIdeasResult.every(block => 
        typeof block === 'object' && block !== null &&
        typeof block.platform === 'string' &&
        typeof block.goal === 'string' &&
        Array.isArray(block.ideas) &&
        block.ideas.every(idea => 
            typeof idea === 'object' && idea !== null &&
            typeof idea.headline === 'string' &&
            typeof idea.visual_direction === 'string' &&
            typeof idea.caption === 'string' &&
            typeof idea.cta === 'string' &&
            (idea.hashtag_suggestions === undefined || (Array.isArray(idea.hashtag_suggestions) && idea.hashtag_suggestions.every(h => typeof h === 'string')))
        )
      )) {
        console.error("Processed AI response does not match the expected ContentIdeaBlock array structure:", contentIdeasResult);
        throw new Error("AI response structure is invalid after processing and validation.");
      }

      return NextResponse.json({ content_ideas: contentIdeasResult });

    } catch (e: unknown) {
      console.error("Error processing AI JSON response:", e, "Raw AI response:", aiResponse);
      const errorMessage = e instanceof Error ? e.message : "Unknown parsing error";
      return NextResponse.json({ error: "Failed to parse content ideas from AI.", details: errorMessage, rawResponse: aiResponse }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error in /api/content-ideas:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // Avoid sending potentially sensitive error details to client in production
    const clientErrorMessage = errorMessage.includes("Azure OpenAI") ? "Error communicating with AI service." : "Failed to generate content ideas.";
    return NextResponse.json({ error: clientErrorMessage, details: errorMessage }, { status: 500 });
  }
} 