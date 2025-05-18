'use client';

import React, { useState } from 'react';
import { CampaignWizardForm, type CampaignFormData, type ManualPerformanceData } from '@/components/wizard/CampaignWizardForm';
import { StrategyList, type Strategy } from '@/components/wizard/results/StrategyList';
import { ContentIdeaGrid, type ContentIdeaBlock } from '@/components/wizard/results/ContentIdeaGrid';
import { PerformanceAnalysisDashboard, type PerformanceAnalysisData } from '@/components/wizard/results/PerformanceAnalysisDashboard';

interface PerformancePayload {
  goal: string;
  platform?: string;
  metrics: ManualPerformanceData | Record<string, number | string | undefined>;
  past_metrics?: ManualPerformanceData | Record<string, number | string | undefined>;
}

export default function DashboardPage() {
  const [strategies, setStrategies] = useState<Strategy[] | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdeaBlock[] | null>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysisData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWizardSubmit = async (formData: CampaignFormData) => {
    setIsLoading(true);
    setError(null);
    setStrategies(null);
    setContentIdeas(null);
    setPerformanceAnalysis(null); // Reset performance analysis data

    try {
      // 1. Generate Strategy
      const strategyResponse = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!strategyResponse.ok) {
        const errData = await strategyResponse.json();
        throw new Error(errData.error || 'Failed to generate strategy');
      }
      const strategyData = await strategyResponse.json();
      setStrategies(strategyData.strategies);

      // 2. Generate Content Ideas (using formData and potentially strategyData)
      // For content ideas, the API expects: goals, platforms, brand_offer_details, demographics, audience_interests
      const contentIdeasPayload = {
        goals: formData.goals || [],
        platforms: formData.platforms || [],
        brand_offer_details: formData.brand_offer_details || '',
        demographics: formData.demographics || { age_range: [], gender: [], location: '' },
        audience_interests: formData.audience_interests || [],
      };
      const contentIdeasResponse = await fetch('/api/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentIdeasPayload),
      });
      if (!contentIdeasResponse.ok) {
        const errData = await contentIdeasResponse.json();
        throw new Error(errData.error || 'Failed to generate content ideas');
      }
      const contentIdeasData = await contentIdeasResponse.json();
      setContentIdeas(contentIdeasData.content_ideas);

      // 3. Performance Analysis
      // Call /api/performance-analysis if manual_performance_data exists in formData.
      // Assumes PerformanceStep.tsx has already processed any CSV file into manual_performance_data.
      if (formData.manual_performance_data && Object.keys(formData.manual_performance_data).length > 0) {
        const performancePayload: PerformancePayload = {
            goal: formData.goals?.[0] || 'unknown_goal',
            platform: formData.platforms?.[0] || 'unknown_platform',
            metrics: formData.manual_performance_data,
            // past_metrics can be added here if collected by the wizard
        };
        
        const performanceAnalysisResponse = await fetch('/api/performance-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(performancePayload),
        });
        if (!performanceAnalysisResponse.ok) {
            const errData = await performanceAnalysisResponse.json();
            throw new Error(errData.error || 'Failed to analyze performance');
        }
        const performanceAnalysisData = await performanceAnalysisResponse.json();
        setPerformanceAnalysis(performanceAnalysisData);
      } else {
        // If no manual_performance_data, ensure performanceAnalysis state is reset/null
        setPerformanceAnalysis(null);
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">AI Marketing Agent Dashboard</h1>
        <p className="text-muted-foreground">Fill out the details below to generate your marketing strategy, content ideas, and performance insights.</p>
      </header>

      <CampaignWizardForm onSubmit={handleWizardSubmit} />

      {isLoading && (
        <div className="mt-8 text-center">
          <p className="text-lg font-semibold text-primary">Generating your marketing assets, please wait...</p>
          {/* Add a spinner component here if you have one */}
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-100 dark:bg-destructive/20 text-destructive border border-destructive/50 rounded-md">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-12 space-y-12">
        {strategies && strategies.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Generated Strategies</h2>
            <StrategyList strategies={strategies} />
          </section>
        )}

        {contentIdeas && contentIdeas.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Content Ideas</h2>
            <ContentIdeaGrid contentIdeas={contentIdeas} />
          </section>
        )}

        {performanceAnalysis && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Performance Analysis</h2>
            <PerformanceAnalysisDashboard data={performanceAnalysis} />
          </section>
        )}
      </div>
    </div>
  );
} 