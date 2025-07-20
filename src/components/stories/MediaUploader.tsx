'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';

interface MediaFile {
  id: string;
  file?: File;
  url?: string;
  key?: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface MediaUploaderProps {
  onMediaAdd: (files: File[]) => void;
  onMediaUploaded?: (uploadedFiles: Array<{file: File; url: string; key: string}>) => void;
  existingMedia?: MediaFile[];
  onExistingMediaRemove?: (id: string) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  uploadType?: string; // 'story_media', 'profile_picture', etc.
  autoUpload?: boolean;
}

export function MediaUploader({
  onMediaAdd,
  onMediaUploaded,
  existingMedia = [],
  onExistingMediaRemove,
  maxFileSize = 10,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  uploadType = 'story_media',
  autoUpload = true
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const getFileIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File "${file.name}" exceeds maximum size of ${maxFileSize}MB`;
    }
    return null;
  };

  const uploadFile = async (mediaFile: MediaFile) => {
    if (!mediaFile.file) return;

    const formData = new FormData();
    formData.append('file', mediaFile.file);
    formData.append('type', uploadType);
    formData.append('folder', uploadType);

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          : f
      ));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Update file with upload result
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { 
              ...f, 
              uploadStatus: 'complete' as const, 
              uploadProgress: 100,
              url: data.url,
              key: data.key
            }
          : f
      ));

      // Notify parent component
      if (onMediaUploaded && mediaFile.file) {
        onMediaUploaded([{ file: mediaFile.file, url: data.url, key: data.key }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { 
              ...f, 
              uploadStatus: 'error' as const,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: MediaFile[] = [];
    const newErrors: string[] = [];

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: getFileType(file),
          name: file.name,
          size: file.size,
          uploadStatus: 'pending'
        });
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      onMediaAdd(newFiles.map(f => f.file!));

      // Auto-upload files if enabled
      if (autoUpload) {
        for (const file of newFiles) {
          await uploadFile(file);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.uploadStatus === 'uploading') {
      // Don't allow removal during upload
      return;
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryUpload = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (file && file.uploadStatus === 'error') {
      await uploadFile(file);
    }
  };

  const removeExistingFile = (id: string) => {
    if (onExistingMediaRemove) {
      onExistingMediaRemove(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-gray-300 dark:border-gray-700"
        )}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Maximum file size: {maxFileSize}MB
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {(files.length > 0 || existingMedia.length > 0) && (
        <div className="space-y-3">
          <h4 className="font-medium">Attached Media</h4>
          
          {/* Existing Media */}
          {existingMedia.map((media) => {
            const Icon = getFileIcon(media.type);
            return (
              <Card key={media.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{media.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(media.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExistingFile(media.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* New Files */}
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-8 w-8 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {file.uploadStatus === 'uploading' && file.uploadProgress && (
                        <Progress 
                          value={file.uploadProgress} 
                          className="h-1 mt-2" 
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.uploadStatus === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {file.uploadStatus === 'complete' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {file.uploadStatus === 'error' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => retryUpload(file.id)}
                          title="Retry upload"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.uploadStatus === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {file.error && (
                  <p className="text-sm text-red-500 mt-2">{file.error}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}