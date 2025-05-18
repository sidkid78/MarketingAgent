'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Type definitions based on the API output from /api/performance-analysis (subtask B3)
export interface MetricAnalysis {
  metric: string; // e.g., "cvr"
  label: string; // e.g., "Conversion Rate (%)"
  value: number;
  past_value: number | null;
  status: string; // e.g., "Needs Attention"
  flag: "good" | "on_target" | "warning"; // For color coding
  message: string; // Specific recommendation for this metric
  benchmark: string; // e.g., "2–10% (leads), 1–5% (sales)"
  trend?: string; // e.g., "Improved", "Declined", "No change"
}

export interface PerformanceAnalysisData {
  goal: string;
  platform?: string; // Optional, as per B3 output
  summary: string; // Overall summary message
  analysis: MetricAnalysis[];
  adjustment_recommendations: string[]; // List of overall recommendations
}

interface PerformanceAnalysisDashboardProps {
  data: PerformanceAnalysisData | null; // Allow null for initial loading state
}

// Helper for status colors and trend icons
// Updated to return Shadcn Badge variants
const getBadgeVariant = (flag: MetricAnalysis['flag']): "default" | "destructive" | "outline" | "secondary" => {
  switch (flag) {
    case 'good':
      return 'default'; // Or a custom green variant if defined
    case 'warning':
      return 'destructive';
    case 'on_target':
      return 'secondary';
    default:
      return 'outline';
  }
};

const TREND_ICONS: Record<string, string> = {
  Improved: '↑',
  Declined: '↓',
  "No change": '→',
};

export function PerformanceAnalysisDashboard({ data }: PerformanceAnalysisDashboardProps) {
  if (!data) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No performance analysis data to display.</p>
        </CardContent>
      </Card>
    );
  }

  const overallStatusFlag = data.analysis.some(a => a.flag === 'warning') 
    ? 'warning' 
    : data.analysis.some(a => a.flag === 'good') 
      ? 'good' 
      : 'on_target';

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <Card className={`border-l-4 ${overallStatusFlag === 'warning' ? 'border-destructive' : overallStatusFlag === 'good' ? 'border-green-500' : 'border-blue-500'}`}>
        <CardHeader>
          <CardTitle className={`${overallStatusFlag === 'warning' ? 'text-destructive' : overallStatusFlag === 'good' ? 'text-green-600' : 'text-blue-600'}`}>Analysis Summary</CardTitle>
          { (data.platform || data.goal) &&
            <CardDescription className="text-xs pt-1">
              Context: {data.goal && `Goal - ${data.goal.replace('_', ' ')}`} {data.platform && ` | Platform - ${data.platform}`}
            </CardDescription>
          }
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.summary}</p>
        </CardContent>
      </Card>

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metric Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Past Value</TableHead>
                  <TableHead>Benchmark</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.analysis.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{metric.label}</TableCell>
                    <TableCell className="text-right">{metric.value}</TableCell>
                    <TableCell className="text-right">{metric.past_value ?? 'N/A'}</TableCell>
                    <TableCell className="text-xs">{metric.benchmark}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(metric.flag)}>{metric.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {metric.trend && (
                        <span className={`${metric.trend === 'Improved' ? 'text-green-600' : metric.trend === 'Declined' ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {TREND_ICONS[metric.trend]} {metric.trend}
                        </span>
                      )}
                      {!metric.trend && 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs">{metric.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Adjustment Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {data.adjustment_recommendations && data.adjustment_recommendations.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              {data.adjustment_recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No specific overall adjustments recommended at this time. Focus on individual metric insights.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 