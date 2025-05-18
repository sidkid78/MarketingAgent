import { NextRequest, NextResponse } from "next/server";

// Interface for the structure of individual analysis results
interface MetricAnalysisResult {
  metric: string;
  label: string;
  value: number;
  past_value: number | null;
  status: string;
  flag: "good" | "on_target" | "warning";
  message: string;
  benchmark: string;
  trend?: string;
}

// Benchmarks table (ids match A3; values can be extended)
const KPI_BENCHMARKS: Record<string, { min?: number, max?: number, note: string }> = {
  cvr:       { min: 2, max: 10, note: "2–10% (leads), 1–5% (sales)" },
  cpl:       { max: 50, note: "$1–50" },
  ctr:       { min: 0.5, max: 2, note: "0.5–2% (social); 2–5% (search)" },
  engagement_rate: { min: 0.5, max: 5, note: "0.5–5%" },
  bounce_rate: { min: 40, max: 65, note: "40–65%" }, // For bounce rate, higher is typically worse
  cpa:       { max: 100, note: "$5–100" },
  roas:      { min: 2, note: "2x+" },
  aov:       { min: 50, max: 150, note: "$50–$150" }
};

const METRIC_LABELS: Record<string, string> = {
  leads: "Leads",
  cvr: "Conversion Rate (%)",
  cpl: "Cost per Lead ($)",
  ctr: "Click-Through Rate (%)",
  impressions: "Impressions",
  engagement_rate: "Engagement Rate (%)",
  bounce_rate: "Bounce Rate (%)",
  cpa: "Cost per Acquisition ($)",
  roas: "Return on Ad Spend (x)",
  aov: "Average Order Value ($)"
  // Extend as needed
};

// Diagnostic & suggestion mapping for main goals/KPIs
const KPI_RECOMMENDATIONS: Record<string, { low: string; mid: string; high: string }> = {
  cvr:  {
    low: "Test a clearer call-to-action, improve landing page design, and refine offer or audience targeting.",
    mid: "Your conversion rate is within industry norms. Keep optimizing copy and creative for incremental gains.",
    high:"Excellent conversion—consider scaling spend to test new audiences."
  },
  cpl:  {
    low: "High CPL: Try new creative, alternate placements, and refine audience parameters to reduce costs.",
    mid: "CPL is reasonable given volume; monitor as campaigns scale.",
    high:"Low CPL! Consider reallocating extra budget to highest-performing segments."
  },
  ctr:  {
    low: "Low CTR: Review headline and visuals. Test sharper messaging and stronger value props.",
    mid: "CTR is in a healthy range. Maintain creative rotation.",
    high:"Excellent CTR! Try A/B testing for further lift."
  },
  cpa:  {
    low: "High CPA: Optimize ad creative, test retargeting, or review bidding/budget allocations.",
    mid: "CPA looks solid—monitor quality of conversions.",
    high:"Outstanding CPA, scale spend where possible."
  },
  roas: {
    low: "Low ROAS: Reassess creative and targeting. Try focusing on higher-value audiences or adjusting offers.",
    mid: "ROAS is good. Test incremental budget increases.",
    high:"Great ROAS! Safely scale budget; consider duplicating best ad sets."
  },
  engagement_rate: {
    low: "Low engagement: Try more interactive formats, UGC, and call-outs for shares/comments.",
    mid: "Solid engagement—review top posts for repeatable patterns.",
    high: "Great engagement; try retargeting recent engagers for conversions."
  },
  bounce_rate: {
    low: "Very low bounce (can be good, but check for event tracking accuracy).", // Low bounce is generally good
    mid: "Normal bounce rate. Keep optimizing page speed and design.",
    high: "High bounce: Review landing page match to ad creative and make the next step immediately clear."
  }
};

function analyzeMetric(
  metric: string,
  current: number,
  past: number | null
  // goal: string // Removed as it was unused
): {
  status: string,
  flag: "good"|"on_target"|"warning",
  message: string,
  benchmark: string,
  trend?: string
} {
  const bench = KPI_BENCHMARKS[metric];
  let status: string, flag: "good"|"on_target"|"warning", message: string;
  // Only analyze metrics that have configured benchmarks
  if (!bench) {
    return {
      status: "Not benchmarked",
      flag: "on_target", // Default to on_target if no benchmark exists
      message: "No available industry comparison for this metric.",
      benchmark: "N/A"
    }
  }
  // Normalize (deal with % typed as 0–100 or 0–1)
  let val = current;
  // Heuristic: If value is over 1 and benchmark max is <=10 (or min is a typical percentage), treat as %.
  if (
    ["cvr","ctr","engagement_rate","bounce_rate"].includes(metric) && val > 1 && val <= 100
  ) {
    // Ok, assume user entered as percent
  } else if (
    ["cvr","ctr","engagement_rate"].includes(metric) && val >= 0 && val <= 1 // Allow 0 for percentages
  ) {
    // Possibly entered as fraction, scale up
    val = val * 100;
  }

  // Compare to benchmark
  let isGood = false, isMid = false, isLow = false;

  if (metric === "bounce_rate") {
    if (bench.max != null && val > bench.max) isLow = true; // High bounce rate is bad
    else if (bench.min != null && val < bench.min) isGood = true; // Low bounce rate is good
    else isMid = true;
  } else {
    if (bench.min != null && val < bench.min) isLow = true;
    else if (bench.max != null && val > bench.max) isGood = true; // For most metrics, exceeding max is good
    else if (bench.min != null && bench.max != null && val >= bench.min && val <= bench.max) isMid = true;
    else if (bench.min != null && val >= bench.min) isGood = true; // Good if meets/exceeds min and no max defined (e.g. ROAS)
    else if (bench.max != null && val <= bench.max) isMid = true; // On target if below max and no min defined (e.g. CPL)
    else isLow = true; // Default to low if no other conditions met (should be rare)
  }


  // Trend
  let trend = "";
  if (past != null && !isNaN(past)) {
    let pastVal = past;
    // Normalize past value as well if it's a percentage
    if (["cvr","ctr","engagement_rate","bounce_rate"].includes(metric) && pastVal >= 0 && pastVal <= 1) {
        pastVal = pastVal * 100;
    }
    if (val > pastVal) trend = metric === "bounce_rate" ? "down" : "up"; // Improved trend is down for bounce rate
    else if (val < pastVal) trend = metric === "bounce_rate" ? "up" : "down"; // Declined trend is up for bounce rate
    else trend = "flat";
  }

  // Primary diagnostic/recommendations
  const recs = KPI_RECOMMENDATIONS[metric] || {low:"Action recommended.",mid:"Performance is standard.",high:"Performance is strong."};
  if (isLow) {
    status = "Needs Attention";
    flag = "warning";
    message = recs.low;
  } else if (isMid) {
    status = "On Target";
    flag = "on_target";
    message = recs.mid;
  } else { // isGood
    status = "Excellent";
    flag = "good";
    message = recs.high;
  }

  // Trend modulation
  if (trend) {
    const trendDescription = trend === "up" ? (metric === "bounce_rate" ? "worsened" : "improved") : (metric === "bounce_rate" ? "improved" : "worsened");
    if (isGood && trendDescription === "improved") message += ` You've ${trendDescription} over the last period—great!`;
    else if (isLow && trendDescription === "worsened") message += ` The trend is ${trendDescription}—take action soon.`;
    else if (isLow && trend === "flat") message += ` Performance is flat, suggesting this remains a problem area.`;
    else message += ` Trend: ${trendDescription}.`;
  }

  return {
    status,
    flag,
    message,
    benchmark: bench.note,
    trend: trend ? (trend === "up" ? "Improved" : trend === "down" ? "Declined" : "No change") : undefined
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal, platform, metrics, past_metrics } = body;

    if (!goal || !metrics || typeof metrics !== "object") {
      return NextResponse.json({ error: "Missing required fields: goal, metrics (must be an object)" }, { status: 400 });
    }

    // For each provided metric, analyze
    const results: MetricAnalysisResult[] = [];
    for (const mKey of Object.keys(metrics)) {
      const value = metrics[mKey];
      const past = past_metrics && past_metrics[mKey];
      // Ensure value is a number before proceeding
      if (typeof value !== 'number' || isNaN(value)) {
        // Skip or handle error for non-numeric metric values
        console.warn(`Skipping non-numeric metric: ${mKey} with value ${value}`);
        continue;
      }
      const meta = analyzeMetric(mKey, value, past ?? null /*, goal*/);
      results.push({
        metric: mKey,
        label: METRIC_LABELS[mKey] || mKey.toUpperCase(), // Fallback to uppercase key if no label
        value,
        past_value: past ?? null,
        ...meta
      })
    }

    // Diagnostics: summary headline for dashboard/UI
    const nWarnings = results.filter(r => r.flag === "warning").length;
    const nGoods    = results.filter(r => r.flag === "good").length;
    let headlineSummary = "";
    if (nWarnings > 0)
      headlineSummary = `⚠️ ${nWarnings} metric${nWarnings > 1 ? "s are" : " is"} under industry benchmarks. Review suggestions below.`;
    else if (nGoods > 0)
      headlineSummary = `✅ ${nGoods} metric${nGoods > 1 ? "s are" : " is"} beating benchmarks—opportunity to scale!`;
    else
      headlineSummary = `All submitted metrics appear to be within normal ranges. Continue monitoring and optimizing.`;

    // (Optional) If at least one warning, suggest improvements at campaign strategy level
    const suggestionBlocks: string[] = [];
    for (const res of results) {
      if (res.flag === "warning") {
        suggestionBlocks.push(`[${res.label}]: ${res.message}`);
      }
    }
    if (suggestionBlocks.length === 0 && results.length > 0)
      suggestionBlocks.push("No critical issues found based on provided metrics. Continue optimizing and reviewing new creative/audiences routinely.");
    else if (results.length === 0)
      suggestionBlocks.push("No metrics were analyzed. Please provide valid performance data.");

    // Main response
    return NextResponse.json({
      goal,
      platform,
      summary: headlineSummary,
      analysis: results,
      adjustment_recommendations: suggestionBlocks
    })
  } catch (err: unknown) { // Typed as unknown
    let errorMessage = "An unexpected error occurred.";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.error("Error in /api/performance-analysis:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 