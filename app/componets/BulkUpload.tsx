'use client';

import { Upload } from "lucide-react";
import { useState, ChangeEvent } from "react";

export default function BulkUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
            setFile(selectedFile);
        } else {
            alert('Please upload an .xlsx file');
        }
    };

    const handleBulkUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        const settings = {
            title: "Bulk Upload Quiz",
            description: "Quiz created via bulk upload",
            duration: { hours: 1, minutes: 0, seconds: 0 },
            isQuizChallenge: false,
            multipleAttempts: false,
            viewAnswer: true,
            viewResults: true,
            displayCalculator: false
        };

        formData.append('settings', JSON.stringify(settings));
        formData.append('file', file);

        try {
            // Call your Next.js API route instead of external API
            const response = await fetch('/api/quiz/bulk-upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                alert('Quiz uploaded successfully!');
                setFile(null);
            } else {
                alert(`Error: ${data.message || 'Upload failed'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload quiz. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    //     const selectedFile = e.target.files?.[0];
    //     if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
    //         setFile(selectedFile);
    //     } else {
    //         alert('Please upload an .xlsx file');
    //     }
    // };

    // const handleBulkUpload = async () => {
    //     if (!file) {
    //         alert('Please select a file first');
    //         return;
    //     }

    //     setIsUploading(true);

    //     const formData = new FormData();

    //     const settings = {
    //         title: "Bulk Upload Quiz",
    //         description: "Quiz created via bulk upload",
    //         duration: { hours: 1, minutes: 0, seconds: 0 },
    //         isQuizChallenge: false,
    //         multipleAttempts: false,
    //         viewAnswer: true,
    //         viewResults: true,
    //         displayCalculator: false
    //     };

    //     formData.append('settings', JSON.stringify(settings));
    //     formData.append('questions', file);

    //     try {


    //         const data = await bulkuploadQuiz(formData);

    //         if (data?.success) {
    //             alert('Quiz uploaded successfully!');
    //             setFile(null);
    //         } else {
    //             alert(`Error: ${data?.message || 'Upload failed'}`);
    //         }
    //     } catch (error) {
    //         console.error('Upload error:', error);
    //         alert('Failed to upload quiz. Please try again.');
    //     } finally {
    //         setIsUploading(false);
    //     }
    // };

    return (
        <div className="text-center">
            <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 border-2 border-gray-600 text-gray-700 rounded-lg font-medium hover:bg-gray-50 cursor-pointer"
            >
                <Upload className="w-5 h-5 mr-2" />
                {file ? file.name : 'Import from spreadsheet'}
            </label>

            {file && (
                <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={isUploading}
                    className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            )}

        </div>
    );
}