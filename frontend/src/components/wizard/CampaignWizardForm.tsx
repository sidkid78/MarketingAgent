'use client';

import React, { useState } from 'react';
import { GoalStep } from './steps/GoalStep'; // Import the GoalStep component
import { PlatformStep } from './steps/PlatformStep'; // Import the PlatformStep component
import { AudienceStep } from './steps/AudienceStep'; // Import the AudienceStep component
import { BrandOfferStep } from './steps/BrandOfferStep'; // Import the BrandOfferStep component
import { SettingsStep } from './steps/SettingsStep'; // Import the SettingsStep component
import { PerformanceStep } from './steps/PerformanceStep'; // Import the PerformanceStep component
import { Button } from "@/components/ui/button"; // Import Shadcn Button

// Define the structure for the entire form data
interface DemographicsInput {
  age_range?: string[];
  gender?: string[];
  location?: string;
  language?: string;
}

// Define what a row of performance data might look like from manual entry
// This aligns with PerformanceDataRow in PerformanceStep.tsx for consistency
export interface ManualPerformanceData {
  date?: string;
  campaign_name?: string;
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  [key: string]: string | number | undefined;
}

export interface CampaignFormData {
  goals?: string[];
  platforms?: string[];
  demographics?: DemographicsInput;
  brand_offer_details?: string;
  audience_interests?: string[];
  kpis?: string[];
  campaign_budget?: number;
  timeline?: {
    start_date?: string;
    end_date?: string;
  };
  website_url?: string;
  performance_data_file?: File | null; // For CSV upload
  manual_performance_data?: ManualPerformanceData; // For manual entry
}

export interface StepProps {
  formData: CampaignFormData;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>;
  setIsValid: (isValid: boolean) => void; // Callback to parent to set step validity
  nextStep?: () => void; // Optional: some steps might not have it (e.g. review step)
  prevStep?: () => void; // Optional for the first step
}

interface CampaignWizardFormProps {
  onSubmit: (formData: CampaignFormData) => Promise<void>;
}

const TOTAL_STEPS = 6; // As per instructions.md

export function CampaignWizardForm({ onSubmit }: CampaignWizardFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({});
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  const nextStep = () => {
    if (isCurrentStepValid) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
        setIsCurrentStepValid(false); // Reset validity for the new step
      } else {
        // This is the last step, handle submission
        handleSubmitLocal();
      }
    } else {
      // Optionally, show an error or prevent moving
      alert("Please complete the current step correctly before proceeding.");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setIsCurrentStepValid(true); // Assume previous step was valid
    }
  };

  // This function will now call the onSubmit passed from the parent
  const handleSubmitLocal = async () => {
    // Final validation if needed, or assume steps validated themselves
    console.log("Final Form Data:", formData);
    // Call the passed onSubmit prop
    await onSubmit(formData);
  };

  const renderStep = () => {
    const stepProps: StepProps = { formData, setFormData, setIsValid: setIsCurrentStepValid, nextStep, prevStep };
    switch (currentStep) {
      case 1:
        return <GoalStep {...stepProps} />;
      case 2:
        return <PlatformStep {...stepProps} />;
      case 3:
        return <AudienceStep {...stepProps} />;
      case 4:
        return <BrandOfferStep {...stepProps} />;
      case 5:
        return <SettingsStep {...stepProps} />;
      case 6:
        return <PerformanceStep {...stepProps} />;
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div className="bg-card text-card-foreground p-6 md:p-8 rounded-lg shadow-xl border border-border">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Campaign Creation Wizard - Step {currentStep} of {TOTAL_STEPS}</h2>
        <div className="mt-2 h-2 w-full bg-muted rounded">
          <div 
            className="h-2 bg-primary rounded transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          ></div>
        </div>
      </div>

      {renderStep()}

      <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
        <Button 
          variant="outline"
          onClick={prevStep} 
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <Button 
          onClick={nextStep} 
          disabled={!isCurrentStepValid && currentStep < TOTAL_STEPS}
        >
          {currentStep === TOTAL_STEPS ? 'Generate Strategy & Ideas' : 'Next'}
        </Button>
      </div>
    </div>
  );
} 