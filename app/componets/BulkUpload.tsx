// app/componets/BulkUpload.tsx
'use client';

import { Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QuizSettings } from "../types/global";

export default function BulkUpload({settings}: {settings: QuizSettings}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        '.xlsx',
        '.xls'
      ];
      
      const isValid = validTypes.some(type => 
        file.type === type || file.name.endsWith(type)
      );

      if (!isValid) {
        alert('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('settings', JSON.stringify(settings));
      formData.append('file', selectedFile);

      const response = await fetch('/api/quiz/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      alert('Quiz created successfully from spreadsheet!');
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Redirect to home or quiz list
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload quiz');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Import from Spreadsheet
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 text-center">
            Upload an Excel file (.xlsx) with your quiz questions
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile ? (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload and Create Quiz'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClick}
              className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50"
            >
              Choose File
            </button>
          )}
        </div>
      </div>

      
    </div>
  );
}

// 'use client';

// import { Upload } from "lucide-react";
// import { useState, ChangeEvent } from "react";

// export default function BulkUpload() {
//     const [file, setFile] = useState<File | null>(null);
//     const [isUploading, setIsUploading] = useState<boolean>(false);
//     const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0];
//         if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
//             setFile(selectedFile);
//         } else {
//             alert('Please upload an .xlsx file');
//         }
//     };

//     const handleBulkUpload = async () => {
//         if (!file) {
//             alert('Please select a file first');
//             return;
//         }

//         setIsUploading(true);

//         const formData = new FormData();
//         const settings = {
//             title: "Bulk Upload Quiz",
//             description: "Quiz created via bulk upload",
//             duration: { hours: 1, minutes: 0, seconds: 0 },
//             isQuizChallenge: false,
//             multipleAttempts: false,
//             viewAnswer: true,
//             viewResults: true,
//             displayCalculator: false
//         };

//         formData.append('settings', JSON.stringify(settings));
//         formData.append('file', file);

//         try {
//             // Call your Next.js API route instead of external API
//             const response = await fetch('/api/quiz/bulk-upload', {
//                 method: 'POST',
//                 body: formData,
//             });

//             const data = await response.json();

//             if (data.success) {
//                 alert('Quiz uploaded successfully!');
//                 setFile(null);
//             } else {
//                 alert(`Error: ${data.message || 'Upload failed'}`);
//             }
//         } catch (error) {
//             console.error('Upload error:', error);
//             alert('Failed to upload quiz. Please try again.');
//         } finally {
//             setIsUploading(false);
//         }
//     };

//     // const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     //     const selectedFile = e.target.files?.[0];
//     //     if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
//     //         setFile(selectedFile);
//     //     } else {
//     //         alert('Please upload an .xlsx file');
//     //     }
//     // };

//     // const handleBulkUpload = async () => {
//     //     if (!file) {
//     //         alert('Please select a file first');
//     //         return;
//     //     }

//     //     setIsUploading(true);

//     //     const formData = new FormData();

//     //     const settings = {
//     //         title: "Bulk Upload Quiz",
//     //         description: "Quiz created via bulk upload",
//     //         duration: { hours: 1, minutes: 0, seconds: 0 },
//     //         isQuizChallenge: false,
//     //         multipleAttempts: false,
//     //         viewAnswer: true,
//     //         viewResults: true,
//     //         displayCalculator: false
//     //     };

//     //     formData.append('settings', JSON.stringify(settings));
//     //     formData.append('questions', file);

//     //     try {


//     //         const data = await bulkuploadQuiz(formData);

//     //         if (data?.success) {
//     //             alert('Quiz uploaded successfully!');
//     //             setFile(null);
//     //         } else {
//     //             alert(`Error: ${data?.message || 'Upload failed'}`);
//     //         }
//     //     } catch (error) {
//     //         console.error('Upload error:', error);
//     //         alert('Failed to upload quiz. Please try again.');
//     //     } finally {
//     //         setIsUploading(false);
//     //     }
//     // };

//     return (
//         <div className="text-center">
//             <input
//                 type="file"
//                 accept=".xlsx"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 id="file-upload"
//             />
//             <label
//                 htmlFor="file-upload"
//                 className="inline-flex items-center px-6 py-3 border-2 border-gray-600 text-gray-700 rounded-lg font-medium hover:bg-gray-50 cursor-pointer"
//             >
//                 <Upload className="w-5 h-5 mr-2" />
//                 {file ? file.name : 'Import from spreadsheet'}
//             </label>

//             {file && (
//                 <button
//                     type="button"
//                     onClick={handleBulkUpload}
//                     disabled={isUploading}
//                     className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
//                 >
//                     {isUploading ? 'Uploading...' : 'Upload'}
//                 </button>
//             )}

//         </div>
//     );
// }