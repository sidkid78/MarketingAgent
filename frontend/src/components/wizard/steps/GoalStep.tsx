'use client';

import React, { useEffect } from 'react';
import type { StepProps } from '../CampaignWizardForm'; // CampaignFormData removed, StepProps imports it
import { Checkbox } from '@/components/ui/checkbox'; // Import Shadcn Checkbox
import { Label } from '@/components/ui/label'; // Import Shadcn Label

// interface GoalStepProps { // Removed local interface
//   formData: CampaignFormData;
//   setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>;
//   // nextStep: () => void; // Validation will be handled by the main form for now
// }

const MARKETING_GOALS = [
  {
    id: "lead_generation",
    label: "Lead Generation",
    description: "Attract and capture potential customers interested in your products or services."
  },
  {
    id: "brand_awareness",
    label: "Brand Awareness",
    description: "Increase recognition and recall of your brand among your target audience."
  },
  {
    id: "website_traffic",
    label: "Website Traffic",
    description: "Drive users to visit your website or landing page."
  },
  {
    id: "engagement",
    label: "Engagement",
    description: "Encourage interactions (likes, shares, comments) with your content."
  },
  {
    id: "sales_conversions",
    label: "Sales/Conversions",
    description: "Generate actual sales or completed actions (purchases, signups, downloads)."
  }
];

export function GoalStep({ formData, setFormData, setIsValid }: StepProps) { // Use StepProps and destructure setIsValid
  const handleGoalChange = (goalId: string) => {
    const currentGoals = formData.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(g => g !== goalId)
      : [...currentGoals, goalId];
    setFormData(prev => ({ ...prev, goals: newGoals }));
  };

  // Add useEffect to call setIsValid based on formData.goals
  useEffect(() => {
    if (formData.goals && formData.goals.length > 0) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [formData.goals, setIsValid]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-1">Select Your Primary Marketing Goal(s)</h3>
      <p className="text-sm text-gray-500 mb-6">
        What are the main objectives of your campaign? Select all that apply.
      </p>
      <div className="space-y-4">
        {MARKETING_GOALS.map(goal => (
          <div key={goal.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <Checkbox
              id={`goal-${goal.id}`}
              checked={formData.goals?.includes(goal.id) || false}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  handleGoalChange(goal.id);
                }
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`goal-${goal.id}`}
                className="font-medium cursor-pointer"
              >
                {goal.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {goal.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Basic validation feedback example - can be improved with react-hook-form later */}
      {formData.goals && formData.goals.length === 0 && (
        <p className="text-red-500 text-sm mt-2">Please select at least one goal.</p>
      )}
    </div>
  );
} 