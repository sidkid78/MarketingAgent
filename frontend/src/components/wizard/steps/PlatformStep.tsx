'use client';

import React, { useEffect } from 'react';
import type { StepProps } from '../CampaignWizardForm';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PLATFORM_OPTIONS = [
  { id: "facebook", label: "Facebook", description: "Largest social network, versatile for most goals." },
  { id: "instagram", label: "Instagram", description: "Visual platform, great for brand awareness and engagement." },
  { id: "linkedin", label: "LinkedIn", description: "Professional network, ideal for B2B lead generation." },
  { id: "twitter_x", label: "Twitter / X", description: "Real-time updates, good for news and engagement." },
  { id: "google_ads", label: "Google Ads", description: "Search and display ads, effective for website traffic and sales." },
  { id: "tiktok", label: "TikTok", description: "Short-form video, strong for reaching younger audiences." },
  { id: "pinterest", label: "Pinterest", description: "Visual discovery, popular for e-commerce and inspiration." },
];

export function PlatformStep({ formData, setFormData, setIsValid }: StepProps) {
  const handlePlatformChange = (platformId: string) => {
    const currentPlatforms = formData.platforms || [];
    const newPlatforms = currentPlatforms.includes(platformId)
      ? currentPlatforms.filter(p => p !== platformId)
      : [...currentPlatforms, platformId];
    setFormData(prev => ({ ...prev, platforms: newPlatforms }));
  };

  // Basic validation: at least one platform must be selected.
  // Report validation status to parent form.
  useEffect(() => {
    if (setIsValid) {
      setIsValid((formData.platforms?.length || 0) > 0);
    }
  }, [formData.platforms, setIsValid]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-1">Select Marketing Platforms</h3>
      <p className="text-sm text-gray-500 mb-6">
        Choose one or more platforms where your campaign will run. Select all that apply.
      </p>
      <div className="space-y-4">
        {PLATFORM_OPTIONS.map(platform => (
          <div key={platform.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <Checkbox
              id={`platform-${platform.id}`}
              checked={formData.platforms?.includes(platform.id) || false}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  handlePlatformChange(platform.id);
                }
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`platform-${platform.id}`}
                className="font-medium cursor-pointer"
              >
                {platform.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {platform.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Validation feedback display */}
      {(formData.platforms?.length || 0) === 0 && (
        <p className="text-red-500 text-sm mt-2">Please select at least one platform.</p>
      )}
    </div>
  );
} 