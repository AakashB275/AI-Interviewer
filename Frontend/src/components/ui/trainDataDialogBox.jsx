import React, { useState, useEffect } from 'react';
import {
  Upload,
  X,
  File,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
  Brain,
  FileCheck
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

function TrainAIDialog({ isOpen, onClose }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dataType, setDataType] = useState('general');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState({
    hasUploadedData: false,
    fileCount: 0,
    lastUpdated: null
  });

  // Fetch existing training status when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTrainingStatus();
    }
  }, [isOpen]);

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch('/api/upload/status', {
        credentials: 'include'
      });
      
      // Check if response is OK and content type is JSON
      if (!response.ok) {
        console.warn('Training status endpoint returned non-OK status:', response.status);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Training status endpoint returned non-JSON response');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTrainingStatus(data);
      }
    } catch (error) {
      // Silently handle errors - API might not be available
      console.warn('Training status not available:', error.message);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList);
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json'
    ];

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        setUploadStatus({
          type: 'error',
          message: `${file.name} is not a valid file type. Please upload PDF, DOC, DOCX, TXT, or JSON files.`
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          type: 'error',
          message: `${file.name} is too large. Maximum file size is 10MB.`
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setUploadStatus(null);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({
        type: 'error',
        message: 'Please select files to upload'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('trainingFiles', file);
      });
      
      formData.append('dataType', dataType);
      formData.append('description', description);

      const response = await fetch('/api/upload/train-data', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded ${data.uploadedFiles.length} files!`
        });
        setSelectedFiles([]);
        setDescription('');
        fetchTrainingStatus();
        
        // Auto close after successful upload
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setUploadStatus({
          type: 'error',
          message: data.error || 'Upload failed'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <File className="text-red-500" size={20} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="text-blue-500" size={20} />;
    if (fileType.includes('text')) return <FileText className="text-gray-500" size={20} />;
    return <File className="text-gray-500" size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-gray-300/95 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <Brain className="text-purple-400" size={24} />
                </div>
                <div>
                  <CardTitle className="text-black ml-0">Upload Your Resume</CardTitle>
                  <CardDescription className="text-black">
                    Upload your resume to personalize your AI interviewer
                  </CardDescription>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="text-black" size={20} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Status */}
            {trainingStatus.hasUploadedData && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle size={18} />
                  <span className="font-medium">AI Training Data Ready</span>
                </div>
                <p className="text-gray-300 text-sm">
                  {trainingStatus.fileCount} files uploaded • Last updated: {
                    new Date(trainingStatus.lastUpdated).toLocaleDateString()
                  }
                </p>
              </div>
            )}

            {/* Data Type Selection
            <div>
              <label className="block text-black font-medium mb-2">Data Type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/20 text-black rounded-lg px-3 py-2 focus:border-purple-400 focus:outline-none"
              >
                <option value="general">General Training Data</option>
                <option value="resume">Resume/CV</option>
                <option value="job-description">Job Descriptions</option>
                <option value="interview-questions">Interview Questions</option>
              </select>
            </div> */}

            {/* Description
            <div>
              <label className="block text-black font-medium mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your training data..."
                rows="3"
                className="w-full bg-slate-700/50 border border-white/20 text-black placeholder-gray-400 rounded-lg px-3 py-2 focus:border-purple-400 focus:outline-none resize-none"
              />
            </div> */}

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragActive 
                  ? 'border-purple-400 bg-purple-500/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="text-black mx-auto mb-4" size={40} />
              <p className="text-black mb-2">
                <strong>Drag and drop files here</strong> or click to select
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Supports PDF, DOC, DOCX, TXT, JSON files (max 10MB each)
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer"
              >
                <Upload size={18} className="mr-2" />
                Select Files
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-3">Selected Files ({selectedFiles.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-white text-sm font-medium">{file.name}</p>
                          <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus && (
              <div className={`p-4 rounded-lg border ${
                uploadStatus.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{uploadStatus.message}</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-black hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <FileCheck size={16} />
                  Upload & Train
                </>
              )}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default TrainAIDialog;