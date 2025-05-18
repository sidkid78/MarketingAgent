'use client';

import React, { useEffect } from 'react';
import type { StepProps } from '../CampaignWizardForm';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Basic URL validation regex (for client-side hint, server should re-validate)
const URL_REGEX = /^(ftp|http|https):\/\/[^ "\s]+$/;

export function BrandOfferStep({ formData, setFormData, setIsValid }: StepProps) {
  const handleBrandOfferChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, brand_offer_details: e.target.value }));
  };

  const handleWebsiteUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, website_url: e.target.value }));
  };

  useEffect(() => {
    if (setIsValid) {
      const brandDetailsValid = 
        (formData.brand_offer_details?.trim() || '').length >= 10 && 
        (formData.brand_offer_details?.trim() || '').length <= 500;
      
      const websiteUrlValid = 
        !formData.website_url || 
        formData.website_url.trim() === '' || 
        URL_REGEX.test(formData.website_url.trim());
      
      setIsValid(brandDetailsValid && websiteUrlValid);
    }
  }, [formData.brand_offer_details, formData.website_url, setIsValid]);

  const isBrandDetailsValid = (formData.brand_offer_details?.trim() || '').length >= 10 && (formData.brand_offer_details?.trim() || '').length <= 500;
  const isWebsiteUrlValid = !formData.website_url || formData.website_url.trim() === '' || URL_REGEX.test(formData.website_url.trim());

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Brand/Offer Details</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tell us about your product, service, or what you&apos;re promoting.
        </p>
      </div>

      {/* Brand/Offer Details */}
      <div className="space-y-2">
        <Label htmlFor="brand_offer_details" className="text-sm font-medium">
          Brand/Offer Description *
        </Label>
        <Textarea
          id="brand_offer_details"
          value={formData.brand_offer_details || ''}
          onChange={handleBrandOfferChange}
          rows={4}
          placeholder="Describe your product/service/offer in 1-2 sentences (min 10, max 500 characters). E.g., &apos;Online coding bootcamp for teens focusing on Python and JavaScript.&apos;"
          className={!isBrandDetailsValid && formData.brand_offer_details !== undefined ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {!isBrandDetailsValid && formData.brand_offer_details !== undefined && (
          <p className="text-xs text-red-500">
            Please provide a description between 10 and 500 characters.
          </p>
        )}
      </div>

      {/* Website/App URL (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="website_url" className="text-sm font-medium">
          Website/App URL (Optional)
        </Label>
        <Input
          type="url"
          id="website_url"
          value={formData.website_url || ''}
          onChange={handleWebsiteUrlChange}
          placeholder="e.g., https://www.example.com"
          className={!isWebsiteUrlValid && formData.website_url ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {!isWebsiteUrlValid && formData.website_url && (
          <p className="text-xs text-red-500">Please enter a valid URL (e.g., https://example.com).</p>
        )}
      </div>
    </div>
  );
} 