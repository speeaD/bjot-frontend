/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, Info } from 'lucide-react';

interface QuestionSetUploadProps {
  onSuccess?: () => void;
}

export default function QuestionSetUpload({ onSuccess }: QuestionSetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [usesBatches, setUsesBatches] = useState(false);
  const [batchNumber, setBatchNumber] = useState(1);
  const [batchName, setBatchName] = useState('Batch 1');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setErrors({ file: 'Please upload a CSV or Excel file' });
        return;
      }
      
      setFile(selectedFile);
      setErrors({});
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/questionset/template/download', {
        headers: {
          'Content-Type': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questionset-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Question set title is required';
    }

    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }

    if (usesBatches) {
      if (!batchName.trim()) {
        newErrors.batchName = 'Batch name is required when using batches';
      }
      if (batchNumber < 1) {
        newErrors.batchNumber = 'Batch number must be at least 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file!);
      formData.append('title', title.trim());
      formData.append('usesBatches', usesBatches.toString());
      
      if (usesBatches) {
        formData.append('batchNumber', batchNumber.toString());
        formData.append('batchName', batchName.trim());
      }

      const response = await fetch('/api/questionset/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload question set');
      }

      const result = await response.json();
      console.log('Question set uploaded successfully:', result);
      
      alert(`Question set created successfully with ${result.questionSet.questionCount} questions!`);
      
      // Reset form
      setFile(null);
      setTitle('');
      setUsesBatches(false);
      setBatchNumber(1);
      setBatchName('Batch 1');
      setErrors({});
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading question set:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload question set');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Question Set</h2>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About Batches:</p>
              <p>
                You can organize questions into batches to create different variations of quizzes. 
                For example, create &quot;Easy&ldquo;, &quot;Medium&quot;, and &quot;Hard&quot; batches within the same question set. 
                This allows you to use the same question set in multiple quizzes with different difficulty levels.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Set Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Question Set Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Mathematics Questions"
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Use Batches Toggle */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="usesBatches"
              checked={usesBatches}
              onChange={(e) => {
                setUsesBatches(e.target.checked);
                if (e.target.checked && !batchName) {
                  setBatchName('Batch 1');
                }
              }}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="usesBatches" className="ml-3 flex-1">
              <span className="text-sm font-medium text-gray-700">Use Batch System</span>
              <p className="text-xs text-gray-500 mt-1">
                Enable this to organize questions into batches for different quiz variations
              </p>
            </label>
          </div>

          {/* Batch Details (conditional) */}
          {usesBatches && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
              <h3 className="font-semibold text-amber-900">Batch Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="batchNumber"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(parseInt(e.target.value) || 1)}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.batchNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.batchNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.batchNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="batchName" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="batchName"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.batchName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Batch 1 - Easy"
                  />
                  {errors.batchName && (
                    <p className="mt-1 text-sm text-red-600">{errors.batchName}</p>
                  )}
                </div>
              </div>

              <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded">
                <strong>Note:</strong> You&apos;re creating {batchName || `Batch ${batchNumber}`}. 
                After upload, you can add more batches to this question set from the question set management page.
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (CSV or Excel) <span className="text-red-500">*</span>
            </label>
            
            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
              errors.file ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-500'
            }`}>
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                {file ? (
                  <>
                    <FileSpreadsheet className="w-12 h-12 text-green-600 mb-3" />
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="mt-3 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      CSV or Excel files only
                    </p>
                  </>
                )}
              </label>
            </div>
            
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
          </div>

          {/* File Format Instructions */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">File Format Requirements:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Must include headers: type, question, options, correctanswer, points</li>
              <li>Question types: multiple-choice, true-false, essay, fill-in-the-blanks</li>
              <li>For multiple-choice: separate options with | (pipe)</li>
              <li>For true-false: use &quot;true&quot; or &quot;false&quot; as correct answer</li>
              <li>Download the template above for the correct format</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Question Set
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}