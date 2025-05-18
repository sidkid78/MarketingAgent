'use client';

import React from 'react';
// Re-using labels from StrategyList for consistency. Consider moving to a shared constants file later.
// import { PLATFORM_LABELS, STRATEGY_GOAL_LABELS } from './StrategyList';
import { PLATFORM_LABELS, STRATEGY_GOAL_LABELS } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Type definitions based on the API output from /api/content-ideas
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

interface ContentIdeaGridProps {
  contentIdeas: ContentIdeaBlock[]; // Matches the `content_ideas` array from the API response
}

export function ContentIdeaGrid({ contentIdeas }: ContentIdeaGridProps) {
  if (!contentIdeas || contentIdeas.length === 0) {
    return <p className="text-center text-muted-foreground">No content ideas to display.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {contentIdeas.map((block, blockIndex) => (
        <Card key={blockIndex} className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {PLATFORM_LABELS[block.platform] || block.platform} - {STRATEGY_GOAL_LABELS[block.goal] || block.goal}
            </CardTitle>
            {/* Optionally, platform and goal can be Badges here too if desired for more visual separation */}
          </CardHeader>

          <CardContent className="space-y-4 flex-grow">
            {block.ideas.map((idea, ideaIndex) => (
              <div key={ideaIndex} className="border border-border bg-card p-4 rounded-lg space-y-2 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-md text-foreground">{idea.headline}</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Visual Direction:</span> {idea.visual_direction}
                </p>
                <p className="text-sm text-muted-foreground">{idea.caption}</p>
                <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-2">
                  <Badge variant="outline" className="py-1 px-2">
                    CTA: {idea.cta}
                  </Badge>
                  {idea.hashtag_suggestions && idea.hashtag_suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.hashtag_suggestions.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="py-1 px-2">
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 