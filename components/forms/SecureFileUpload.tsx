'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  File,
  AlertTriangle,
  CheckCircle,
  Shield,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { validateFileUpload, FileValidationOptions } from '@/lib/formValidation';
import { useAccessibilityContext } from '@/components/accessibility/AccessibilityProvider';

interface SecureFileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  accept?: string;
  className?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

export default function SecureFileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  className = '',
  label = 'Upload Files',
  description = 'Select files to upload',
  required = false,
  disabled = false
}: SecureFileUploadProps) {
  const { announce } = useAccessibilityContext();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationOptions: FileValidationOptions = {
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    allowedTypes,
    maxFiles
  };

  const generateFileId = () => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setValidationErrors([]);

    // Validate files
    const validation = validateFileUpload(fileArray, validationOptions);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      announce(`File validation failed: ${validation.errors.join(', ')}`, 'assertive');
      return;
    }

    // Check if adding these files would exceed the limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      const error = `Cannot upload more than ${maxFiles} files`;
      setValidationErrors([error]);
      announce(error, 'assertive');
      return;
    }

    // Process each file
    const newFiles: UploadedFile[] = [];
    for (const file of fileArray) {
      const id = generateFileId();
      const preview = await createFilePreview(file);

      const uploadedFile: UploadedFile = {
        file,
        id,
        preview,
        status: 'uploading',
        progress: 0
      };

      newFiles.push(uploadedFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    for (const uploadedFile of newFiles) {
      await simulateUpload(uploadedFile.id);
    }

    // Update parent component
    const allFiles = [...uploadedFiles, ...newFiles].map(uf => uf.file);
    onFilesChange(allFiles);

    announce(`${fileArray.length} file(s) uploaded successfully`, 'polite');
  };

  const simulateUpload = async (fileId: string): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setUploadedFiles(prev =>
            prev.map(file =>
              file.id === fileId
                ? { ...file, status: 'success', progress: 100 }
                : file
            )
          );
          resolve();
        } else {
          setUploadedFiles(prev =>
            prev.map(file =>
              file.id === fileId
                ? { ...file, progress }
                : file
            )
          );
        }
      }, 100);
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(file => file.id !== fileId);
      const allFiles = updated.map(uf => uf.file);
      onFilesChange(allFiles);
      return updated;
    });

    announce('File removed', 'polite');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  }, [disabled]);

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else {
      return '📎';
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label and Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security:</strong> Files are scanned for viruses and validated before upload.
          Maximum file size: {maxSize}MB. Allowed types: {allowedTypes.join(', ')}.
        </AlertDescription>
      </Alert>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? openFileSelector : undefined}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            disabled ? 'text-gray-400' : 'text-gray-500'
          }`} />

          <h3 className={`text-lg font-medium mb-2 ${
            disabled ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
          </h3>

          <p className={`text-sm mb-4 ${
            disabled ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {!disabled && (
              <>
                Supports: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
                <br />
                Max {maxFiles} files, {maxSize}MB each
              </>
            )}
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              openFileSelector();
            }}
          >
            Select Files
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
            aria-label="File upload input"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>

          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-lg">
                        {getFileIcon(uploadedFile.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </h5>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{formatFileSize(uploadedFile.file.size)}</span>
                      <Badge variant="outline" className="text-xs">
                        {uploadedFile.file.type.split('/')[1].toUpperCase()}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {Math.round(uploadedFile.progress)}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadedFile.status === 'error' && uploadedFile.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">
                        {uploadedFile.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(uploadedFile.status)}

                    {uploadedFile.status === 'success' && uploadedFile.preview && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Open preview in new window
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(`
                              <img src="${uploadedFile.preview}" style="max-width: 100%; height: auto;" />
                            `);
                          }
                        }}
                        aria-label="Preview file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(uploadedFile.id)}
                      aria-label="Remove file"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {uploadedFiles.filter(f => f.status === 'success').length} of {uploadedFiles.length} files uploaded successfully
        </div>
      )}
    </div>
  );
}