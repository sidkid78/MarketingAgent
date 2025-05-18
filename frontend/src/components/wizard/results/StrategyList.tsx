'use client';

import React from 'react';
import { STRATEGY_GOAL_LABELS, PLATFORM_LABELS } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Type definition for a single strategy object, based on API output from B1
export interface Strategy {
  goal: string;
  platform: string;
  strategy_title: string;
  summary: string;
  recommendations: string[];
  rationale: string;
  kpis: string[];
}

interface StrategyListProps {
  strategies: Strategy[];
}

export function StrategyList({ strategies }: StrategyListProps) {
  if (!strategies || strategies.length === 0) {
    return <p className="text-center text-muted-foreground">No strategies to display.</p>;
  }

  return (
    <div className="space-y-6">
      {strategies.map((strategy, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
              <CardTitle className="text-2xl leading-tight">{strategy.strategy_title}</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 sm:pt-0">
                <Badge variant="outline">
                  Goal: {STRATEGY_GOAL_LABELS[strategy.goal] || strategy.goal}
                </Badge>
                <Badge variant="secondary">
                  Platform: {PLATFORM_LABELS[strategy.platform] || strategy.platform}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-md font-semibold text-foreground hover:no-underline">
                  Summary
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pt-1 pb-3">
                  {strategy.summary}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-md font-semibold text-foreground hover:no-underline">
                  Recommendations
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pt-1 pb-3">
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    {strategy.recommendations.map((rec, recIndex) => (
                      <li key={recIndex}>{rec}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-md font-semibold text-foreground hover:no-underline">
                  Key KPIs to Monitor
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pt-1 pb-3">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {strategy.kpis.map((kpi, kpiIndex) => (
                      <Badge key={kpiIndex} variant="default">{kpi.toUpperCase()}</Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b-0">
                <AccordionTrigger className="text-md font-semibold text-foreground hover:no-underline">
                  Rationale
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground italic pt-1 pb-3">
                  {strategy.rationale}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 