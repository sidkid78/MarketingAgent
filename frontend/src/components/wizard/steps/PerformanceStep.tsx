'use client';

import React, { useState, useEffect } from 'react';
import type { StepProps, ManualPerformanceData } from '../CampaignWizardForm';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Headers for the downloadable CSV template (ensure these are lowercase for matching)
const CSV_TEMPLATE_HEADERS = ['date', 'campaign_name', 'impressions', 'clicks', 'spend', 'conversions'];

// Helper to generate CSV template content
const generateCsvTemplate = () => {
  return CSV_TEMPLATE_HEADERS.join(',') + '\n' + '2024-01-01,Campaign A,10000,500,200,50\n';
};

// Basic CSV parser - for this iteration, it will focus on the first data row
// and convert it to ManualPerformanceData format.
function parseCsvToManualPerformanceData(csvText: string): ManualPerformanceData | null {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return null; // Must have header and at least one data row

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const firstDataLine = lines[1]; // Process only the first data row
  const values = firstDataLine.split(',').map(v => v.trim());

  if (values.length !== headers.length) return null; // Malformed row

  const parsedRow: ManualPerformanceData = {};
  headers.forEach((header, index) => {
    const value = values[index];
    // Ensure keys match ManualPerformanceData structure
    if (CSV_TEMPLATE_HEADERS.includes(header)) { // Only map known headers
      const key = header as keyof ManualPerformanceData;
      if (['impressions', 'clicks', 'spend', 'conversions'].includes(String(key)) && value !== '' && !isNaN(Number(value))) {
        parsedRow[key] = Number(value) as number;
      } else if (value !== '' && (key === 'date' || key === 'campaign_name')) {
        parsedRow[key] = value as string;
      }
    }
  });

  // Check if any data was actually parsed for the known headers
  return Object.keys(parsedRow).length > 0 ? parsedRow : null;
}

export function PerformanceStep({ formData, setFormData, setIsValid }: StepProps) {
  const [inputMode, setInputMode] = useState<'manual' | 'upload'>('manual');
  // For CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [parsedCsvDataPreview, setParsedCsvDataPreview] = useState<ManualPerformanceData | null>(null);

  // For manual entry
  const [manualMetrics, setManualMetrics] = useState<ManualPerformanceData>(formData.manual_performance_data || {});
  
  // Manual entry fields definition (keys should match ManualPerformanceData)
  const manualEntryFields: Array<{ key: keyof ManualPerformanceData; label: string; type: string, placeholder?: string }> = [
    { key: 'date', label: 'Date (YYYY-MM-DD)', type: 'text', placeholder: 'e.g., 2024-01-15' },
    { key: 'campaign_name', label: 'Campaign Name', type: 'text', placeholder: 'e.g., Q1 Promo' },
    { key: 'impressions', label: 'Impressions', type: 'number', placeholder: 'e.g., 10000' },
    { key: 'clicks', label: 'Clicks', type: 'number', placeholder: 'e.g., 500' },
    { key: 'spend', label: 'Spend ($', type: 'number', placeholder: 'e.g., 250.75' },
    { key: 'conversions', label: 'Conversions', type: 'number', placeholder: 'e.g., 50' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvError(null);
      setParsedCsvDataPreview(null); // Reset preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const parsedData = parseCsvToManualPerformanceData(text);
          if (parsedData) {
            setParsedCsvDataPreview(parsedData);
            // Update main form data with the parsed CSV data (as ManualPerformanceData)
            setFormData(prev => ({ 
              ...prev, 
              manual_performance_data: parsedData, 
              performance_data_file: file // Keep the file ref if needed
            }));
            setManualMetrics(parsedData); // Also update local state for consistency if manual form is shown
          } else {
            setCsvError('Failed to parse CSV. Please ensure it has a header and at least one data row matching the template format.');
          }
        }
      };
      reader.onerror = () => {
        setCsvError('Error reading CSV file.');
      };
      reader.readAsText(file);
    } else {
      setCsvFile(null);
      setFormData(prev => ({ ...prev, performance_data_file: null, manual_performance_data: inputMode === 'manual' ? manualMetrics : undefined }));
    }
  };

  const handleManualMetricChange = (key: keyof ManualPerformanceData, value: string) => {
    const newMetrics = { ...manualMetrics }; // No need to cast to ManualPerformanceData here if manualMetrics is already typed

    if (value === '') {
      newMetrics[key] = undefined;
    } else if (key === 'impressions' || key === 'clicks' || key === 'spend' || key === 'conversions') {
      // Ensure the value is treated as a number for these specific keys
      newMetrics[key] = isNaN(Number(value)) ? manualMetrics[key] : Number(value);
    } else if (key === 'date' || key === 'campaign_name') {
      newMetrics[key] = value;
    }
    setManualMetrics(newMetrics);
    // Update main form data only if in manual mode, to avoid overwriting parsed CSV data if user switches modes after upload
    if (inputMode === 'manual') {
         setFormData(prev => ({ ...prev, manual_performance_data: newMetrics, performance_data_file: null }));
    }
  };

  // Validation effect
  useEffect(() => {
    if (inputMode === 'upload') {
      // If there's a CSV error, the step is invalid.
      // Otherwise (no error, or no file attempted), it's valid as it's an optional step.
      setIsValid(!csvError);
    } else { // manual mode
      // Manual mode is currently always valid as providing data is optional.
      // Parent formData for manual_performance_data is updated by handleManualMetricChange.
      setIsValid(true); 
    }
    // Dependencies: inputMode and csvError determine the validity conditions.
    // setIsValid is a stable function from React's useState.
  }, [inputMode, csvError, setIsValid]);

  // Effect to sync local manualMetrics with formData if it changes from parent (e.g. form reset)
  useEffect(() => {
    // Compare stringified versions to avoid infinite loops due to object reference changes
    if (JSON.stringify(formData.manual_performance_data || {}) !== JSON.stringify(manualMetrics)) {
      setManualMetrics(formData.manual_performance_data || {});
    }
    // If formData clears performance_data_file (e.g. on mode switch or reset), clear local CSV state
    if (!formData.performance_data_file && csvFile) {
        setCsvFile(null);
        setParsedCsvDataPreview(null);
        setCsvError(null);
    }
    // Keep dependencies as they are, the stringify comparison should break the loop for manualMetrics.
    // csvFile being in dependencies is fine if setCsvFile is also guarded or if its updates are intentional triggers.
  }, [formData.manual_performance_data, formData.performance_data_file, csvFile, manualMetrics]);


  const handleDownloadTemplate = () => {
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'performance_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-1">Step 6: Performance Data (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Provide recent campaign performance data for more tailored analysis. You can upload a CSV or enter metrics manually.
          For CSV, please use the first data row for analysis.
        </p>
      </div>

      <ToggleGroup 
        type="single" 
        value={inputMode} 
        onValueChange={(value: 'manual' | 'upload') => {
          if (value) setInputMode(value);
        }}
        className="justify-start"
      >
        <ToggleGroupItem value="manual" aria-label="Toggle manual entry">
          Manual Entry
        </ToggleGroupItem>
        <ToggleGroupItem value="upload" aria-label="Toggle CSV upload">
          Upload CSV
        </ToggleGroupItem>
      </ToggleGroup>

      {inputMode === 'upload' && (
        <div className="space-y-4 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <div>
            <Label htmlFor="csv-upload" className="text-base font-medium mb-2 block">Upload CSV File</Label>
            <Input 
              type="file" 
              id="csv-upload" 
              accept=".csv" 
              onChange={handleFileChange} 
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>
          <Button variant="link" onClick={handleDownloadTemplate} className="text-sm px-0 h-auto">
            Download CSV Template
          </Button>
          {csvError && <p className="text-sm text-destructive">{csvError}</p>}
          {parsedCsvDataPreview && (
            <div className="mt-4 p-4 bg-muted/50 rounded-md border">
              <h4 className="text-base font-semibold text-foreground mb-2">CSV Data Preview (First Row):</h4>
              <pre className="text-xs p-3 bg-background rounded overflow-x-auto border">
                {JSON.stringify(parsedCsvDataPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {inputMode === 'manual' && (
        <div className="space-y-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          {manualEntryFields.map(field => (
            <div key={String(field.key)} className="space-y-2">
              <Label htmlFor={String(field.key)} className="text-base font-medium">{field.label}</Label>
              <Input 
                type={field.type} 
                id={String(field.key)} 
                name={String(field.key)} 
                value={manualMetrics[field.key] || ''} 
                onChange={(e) => handleManualMetricChange(field.key, e.target.value)} 
                placeholder={field.placeholder || (field.type === 'number' ? '0' : 'Enter value')}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 