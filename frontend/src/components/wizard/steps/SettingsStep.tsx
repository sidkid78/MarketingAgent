'use client';

import React, { useEffect } from 'react';
import type { StepProps } from '../CampaignWizardForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Mock KPI options - in a real app, this might be dynamic based on selected goals/platforms
const KPI_OPTIONS = [
  { id: "cpa", label: "Cost Per Acquisition (CPA)" },
  { id: "roas", label: "Return on Ad Spend (ROAS)" },
  { id: "ctr", label: "Click-Through Rate (CTR)" },
  { id: "cvr", label: "Conversion Rate (CVR)" },
  { id: "engagement_rate", label: "Engagement Rate" },
  { id: "reach", label: "Reach" },
  { id: "impressions", label: "Impressions" },
  { id: "cpl", label: "Cost Per Lead (CPL)" },
];

export function SettingsStep({ formData, setFormData, setIsValid }: StepProps) {
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, campaign_budget: value ? Number(value) : undefined }));
  };

  const handleTimelineChange = (field: 'start_date' | 'end_date', value: string) => {
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...(prev.timeline || {}),
        [field]: value,
      },
    }));
  };

  const handleKpiChange = (kpiId: string) => {
    const currentKpis = formData.kpis || [];
    const newKpis = currentKpis.includes(kpiId)
      ? currentKpis.filter(k => k !== kpiId)
      : [...currentKpis, kpiId];
    setFormData(prev => ({ ...prev, kpis: newKpis }));
  };

  // Since all fields in this step are optional according to the plan,
  // we can consider the step always valid for navigation purposes.
  // Specific validation (e.g., budget > 0 if entered, start_date < end_date)
  // can be added if requirements change.
  useEffect(() => {
    if (setIsValid) {
        // Basic validation: if budget is entered, it must be a positive number
        // If timeline dates are entered, start_date should not be after end_date
        let budgetValid = true;
        if (formData.campaign_budget !== undefined && formData.campaign_budget !== null) {
            budgetValid = formData.campaign_budget > 0;
        }

        let timelineValid = true;
        if (formData.timeline?.start_date && formData.timeline?.end_date) {
            timelineValid = new Date(formData.timeline.start_date) <= new Date(formData.timeline.end_date);
        }

      setIsValid(budgetValid && timelineValid);
    }
  }, [formData.campaign_budget, formData.timeline, setIsValid]);

  const isBudgetValid = formData.campaign_budget === undefined || formData.campaign_budget === null || formData.campaign_budget > 0;
  const isTimelineValid = !(formData.timeline?.start_date && formData.timeline?.end_date) || new Date(formData.timeline.start_date) <= new Date(formData.timeline.end_date);


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Campaign Settings & KPIs (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Provide additional details about your campaign. These are all optional.
        </p>
      </div>

      {/* Campaign Budget */}
      <div className="space-y-2">
        <Label htmlFor="campaign_budget" className="text-sm font-medium">
          Campaign Budget ($)
        </Label>
        <Input
          type="number"
          id="campaign_budget"
          value={formData.campaign_budget || ''}
          onChange={handleBudgetChange}
          min="0"
          placeholder="e.g., 5000"
          className={!isBudgetValid && formData.campaign_budget !== undefined ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {!isBudgetValid && formData.campaign_budget !== undefined && (
            <p className="text-xs text-red-500">Budget must be a positive number.</p>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <Label className="block text-sm font-medium mb-1">Campaign Timeline</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date" className="text-xs font-medium text-gray-600">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              value={formData.timeline?.start_date || ''}
              onChange={(e) => handleTimelineChange('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_date" className="text-xs font-medium text-gray-600">End Date</Label>
            <Input
              type="date"
              id="end_date"
              value={formData.timeline?.end_date || ''}
              onChange={(e) => handleTimelineChange('end_date', e.target.value)}
              className={!isTimelineValid && formData.timeline?.start_date && formData.timeline?.end_date ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
          </div>
        </div>
        {!isTimelineValid && formData.timeline?.start_date && formData.timeline?.end_date && (
            <p className="text-xs text-red-500">End date cannot be before start date.</p>
        )}
      </div>

      {/* KPIs */}
      <div className="space-y-2">
        <Label className="block text-sm font-medium">Key Performance Indicators (KPIs)</Label>
        <p className="text-xs text-muted-foreground pb-1">Select the main metrics you&apos;ll use to measure success.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {KPI_OPTIONS.map(kpi => (
            <div key={kpi.id} className="flex items-center space-x-2">
              <Checkbox
                id={`kpi-${kpi.id}`}
                value={kpi.id}
                checked={formData.kpis?.includes(kpi.id) || false}
                onCheckedChange={() => handleKpiChange(kpi.id)}
              />
              <Label htmlFor={`kpi-${kpi.id}`} className="text-sm font-normal cursor-pointer">
                {kpi.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 