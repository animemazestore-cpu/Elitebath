import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, ExternalLink, Link2, AlertCircle } from 'lucide-react';
import { uploadFileToStorage, uploadMultipleFilesToStorage } from '../../lib/storage';

interface SingleProps {
  mode?: 'single';
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  description?: string;
  bucket?: string;
  folder?: string;
}

interface MultipleProps {
  mode: 'multiple';
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  required?: boolean;
  description?: string;
  bucket?: string;
  folder?: string;
}

export type ImageUploadZoneProps = SingleProps | MultipleProps;

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = (props) => {
  const {
    label,
    required,
    description,
    bucket = 'product-images',
    folder = 'products',
  } = props;

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single mode handlers
  const handleSingleFile = async (file: File) => {
    if (props.mode === 'multiple') return;
    setIsUploading(true);
    setUploadWarning(null);

    try {
      const res = await uploadFileToStorage(file, { bucket, folder });
      if (res.url) {
        props.onChange(res.url);
      }
      if (res.error) {
        setUploadWarning(res.error);
      }
    } catch (err: any) {
      setUploadWarning(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  // Multiple mode handlers
  const handleMultipleFiles = async (files: FileList | File[]) => {
    if (props.mode !== 'multiple') return;
    setIsUploading(true);
    setUploadWarning(null);

    try {
      const fileArr = Array.from(files);
      const res = await uploadMultipleFilesToStorage(fileArr, { bucket, folder });
      if (res.urls.length > 0) {
        props.onChange([...props.values, ...res.urls]);
      }
      if (res.errors.length > 0) {
        setUploadWarning(res.errors.join(' | '));
      }
    } catch (err: any) {
      setUploadWarning(err?.message || 'Failed to upload gallery images.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (props.mode === 'multiple') {
        handleMultipleFiles(e.dataTransfer.files);
      } else {
        handleSingleFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (props.mode === 'multiple') {
        handleMultipleFiles(e.target.files);
      } else {
        handleSingleFile(e.target.files[0]);
      }
      // Reset input value so same file can be chosen again if needed
      e.target.value = '';
    }
  };

  // Manual URL Add (for multiple mode)
  const handleAddManualUrl = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    if (props.mode === 'multiple') {
      props.onChange([...props.values, trimmed]);
      setManualInput('');
    } else {
      props.onChange(trimmed);
      setManualInput('');
      setShowManualUrl(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and optional description */}
      {(label || description) && (
        <div className="flex items-center justify-between">
          <div>
            {label && (
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                {label} {required && <span className="text-danger">*</span>}
              </label>
            )}
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-[11px] font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            <Link2 className="h-3 w-3" />
            {showManualUrl ? 'Hide manual URL' : 'Paste link instead'}
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        multiple={props.mode === 'multiple'}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Warning Notice if Storage fallback triggered */}
      {uploadWarning && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-grow">
            <span className="font-semibold">Notice: </span>
            {uploadWarning}
          </div>
          <button
            type="button"
            onClick={() => setUploadWarning(null)}
            className="text-amber-500 hover:text-amber-700 text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* SINGLE MODE */}
      {props.mode !== 'multiple' && (
        <>
          {props.value ? (
            /* Selected Image Preview Card */
            <div className="relative group rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 flex items-center gap-4 transition-all hover:border-gray-300">
              <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-gray-200 border border-gray-200">
                <img
                  src={props.value}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Preview+Error';
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Bucket Uploaded
                  </span>
                  <a
                    href={props.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary transition-colors"
                    title="Open full size image"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="text-xs font-mono text-gray-500 truncate mt-1 max-w-sm">
                  {props.value}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Replace Image
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => props.onChange('')}
                    className="text-xs font-semibold text-danger hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {isUploading ? (
                <div className="py-3 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs font-semibold text-gray-700">
                    Uploading directly to Supabase Storage bucket...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 hover:underline">
                      Click to upload image
                    </span>
                    <span className="text-xs text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    JPG, PNG, WebP or AVIF (auto-stored in <code className="font-mono text-gray-600">{bucket}/{folder}</code>)
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MULTIPLE GALLERY MODE */}
      {props.mode === 'multiple' && (
        <div className="space-y-3">
          {/* Gallery Thumbnails Grid */}
          {props.values.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {props.values.map((url, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-xs"
                >
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/90 text-gray-700 hover:text-primary transition-colors"
                      title="View full image"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...props.values];
                        next.splice(index, 1);
                        props.onChange(next);
                      }}
                      className="p-1.5 rounded-lg bg-white/90 text-danger hover:bg-white transition-colors"
                      title="Delete image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Multiple Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {isUploading ? (
              <div className="py-2 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-xs font-semibold text-gray-700">
                  Uploading files to bucket...
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">Click to select images</span>
                <span>or drag & drop files here</span>
                <span className="text-[11px] text-gray-400">({props.values.length} uploaded)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Manual URL Fallback Input */}
      {showManualUrl && (
        <div className="pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddManualUrl();
                }
              }}
              className="flex-grow px-3 py-1.5 rounded-xl text-xs bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors"
            >
              {props.mode === 'multiple' ? 'Add URL' : 'Set URL'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {props.mode === 'multiple'
              ? 'Paste external image URL and click "Add URL" to append to gallery.'
              : 'Direct links will be used directly without storing in bucket.'}
          </p>
        </div>
      )}
    </div>
  );
};
