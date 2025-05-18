'use client';

import React, { useEffect } from 'react';
import type { StepProps, CampaignFormData } from '../CampaignWizardForm';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// We might use Select later for Language if we have predefined options.
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AGE_RANGES = [
  { id: "18-24", label: "18-24" },
  { id: "25-34", label: "25-34" },
  { id: "35-44", label: "35-44" },
  { id: "45-54", label: "45-54" },
  { id: "55-64", label: "55-64" },
  { id: "65+", label: "65+" },
];

const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "all", label: "All/Prefer not to say" },
];

// TODO: Consider moving to constants.ts if used elsewhere or for i18n
/*
const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "other", label: "Other (Specify)" },
];
*/

export function AudienceStep({ formData, setFormData, setIsValid }: StepProps) {

  const handleDemographicsChange = (
    field: keyof NonNullable<CampaignFormData['demographics']>, 
    value: string | string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      demographics: {
        ...(prev.demographics || {}),
        [field]: value,
      },
    }));
  };

  const handleCheckboxChange = (
    field: keyof NonNullable<CampaignFormData['demographics']>, 
    value: string,
    // isMultiSelect: boolean = true // Defaulting to true, might remove if all are multi
  ) => {
    const currentValues = (formData.demographics?.[field] as string[] | undefined) || [];
    // For multi-select fields like age_range and gender
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleDemographicsChange(field, newValues);
  };

  const handleAudienceInterestsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, audience_interests: e.target.value.split(',\n').map(s => s.trim()).filter(s => s) }));
  };

  useEffect(() => {
    if (setIsValid) {
      const dem = formData.demographics;
      const isValid = 
        (dem?.age_range?.length || 0) > 0 &&
        (dem?.gender?.length || 0) > 0 &&
        (dem?.location?.trim() || '').length > 0;
      setIsValid(isValid);
    }
  }, [formData.demographics, setIsValid]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Define Your Target Audience</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Describe the primary group of people you want to reach.
        </p>
      </div>

      {/* Age Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Age Range *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {AGE_RANGES.map(age => (
            <div key={age.id} className="flex items-center space-x-2">
              <Checkbox
                id={`age-${age.id}`}
                value={age.id}
                checked={formData.demographics?.age_range?.includes(age.id) || false}
                onCheckedChange={() => handleCheckboxChange('age_range', age.id)}
              />
              <Label htmlFor={`age-${age.id}`} className="text-sm font-normal cursor-pointer">
                {age.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Gender *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {GENDERS.map(gender => (
            <div key={gender.id} className="flex items-center space-x-2">
              <Checkbox
                id={`gender-${gender.id}`}
                value={gender.id}
                checked={formData.demographics?.gender?.includes(gender.id) || false}
                onCheckedChange={() => handleCheckboxChange('gender', gender.id)}
              />
              <Label htmlFor={`gender-${gender.id}`} className="text-sm font-normal cursor-pointer">
                {gender.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
        <Input
          type="text"
          id="location"
          value={formData.demographics?.location || ''}
          onChange={(e) => handleDemographicsChange('location', e.target.value)}
          placeholder="e.g., United States, California, London"
        />
      </div>

      {/* Language (Optional) */}
      {/* For now, keeping as Input. Could be Select if options are fixed */}
      <div className="space-y-2">
        <Label htmlFor="language" className="text-sm font-medium">Language (Optional)</Label>
        <Input
          type="text"
          id="language"
          value={formData.demographics?.language || ''}
          onChange={(e) => handleDemographicsChange('language', e.target.value)}
          placeholder="e.g., English, Spanish"
        />
        {/* Example for Select if we decide to use it:
        <Select 
            value={formData.demographics?.language || ""} 
            onValueChange={(value) => handleDemographicsChange('language', value === 'other' ? '' : value)}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
                {LANGUAGE_OPTIONS.map(lang => (
                    <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        {formData.demographics?.language === '' && ( // Show input if 'Other' selected
            <Input
                type="text"
                id="language-specify"
                placeholder="Specify other language"
                onChange={(e) => handleDemographicsChange('language_other_specify', e.target.value)} // Need a new field for this
                className="mt-2"
            />
        )}
        */}
      </div>

      {/* Audience Interests (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="audience_interests" className="text-sm font-medium">Audience Interests (Optional)</Label>
        <Textarea
          id="audience_interests"
          value={(formData.audience_interests || []).join(', \\n')}
          onChange={handleAudienceInterestsChange}
          rows={3}
          placeholder="Enter interests, separated by commas or new lines (e.g., fitness, yoga, digital marketing)"
        />
        <p className="text-xs text-muted-foreground">Separate multiple interests with a comma or by starting a new line.</p>
      </div>

      {/* Validation feedback display */}
      {!(
        (formData.demographics?.age_range?.length || 0) > 0 &&
        (formData.demographics?.gender?.length || 0) > 0 &&
        (formData.demographics?.location?.trim() || '').length > 0
      ) && (
        <p className="text-red-500 text-sm mt-2">Please select Age Range, Gender, and enter a Location.</p>
      )}
    </div>
  );
} 