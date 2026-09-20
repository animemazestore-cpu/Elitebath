import { supabase } from './supabase';

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeBytes?: number;
}

const DEFAULT_BUCKET = 'product-images';
const DEFAULT_FOLDER = 'products';
const DEFAULT_MAX_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Converts a File to a base64 Data URL (useful for local fallback or immediate preview)
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a single file to Supabase Storage bucket.
 * Returns public URL on success, or falls back to local data URL if bucket is unreachable.
 */
export const uploadFileToStorage = async (
  file: File,
  options?: UploadOptions
): Promise<{ url: string; error?: string; isFallback?: boolean }> => {
  const bucket = options?.bucket || DEFAULT_BUCKET;
  const folder = options?.folder || DEFAULT_FOLDER;
  const maxSize = options?.maxSizeBytes || DEFAULT_MAX_SIZE;

  // 1. File size check
  if (file.size > maxSize) {
    const sizeMb = Math.round(maxSize / (1024 * 1024));
    return {
      url: '',
      error: `File size exceeds the ${sizeMb}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  // 2. Prepare clean path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = file.name
    .substring(0, file.name.lastIndexOf('.') || file.name.length)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40);
  const fileName = `${Date.now()}_${cleanName}.${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  try {
    // 3. Attempt Supabase upload
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`Supabase Storage upload error on bucket '${bucket}':`, uploadError);
      // If upload failed (e.g. bucket doesn't exist yet or offline), fall back to base64 so admin is not blocked
      const fallbackUrl = await fileToDataUrl(file);
      return {
        url: fallbackUrl,
        error: `Supabase Storage upload warning (${uploadError.message}). Using local preview fallback. Please ensure the '${bucket}' bucket exists and is public in Supabase.`,
        isFallback: true,
      };
    }

    // 4. Retrieve public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (publicData?.publicUrl) {
      return { url: publicData.publicUrl };
    }

    const fallbackUrl = await fileToDataUrl(file);
    return { url: fallbackUrl, isFallback: true };
  } catch (err: any) {
    console.warn('Storage upload exception, falling back to local preview:', err);
    try {
      const fallbackUrl = await fileToDataUrl(file);
      return {
        url: fallbackUrl,
        error: err?.message || 'Storage error. Using local preview.',
        isFallback: true,
      };
    } catch {
      return { url: '', error: 'Failed to process file.' };
    }
  }
};

/**
 * Uploads multiple files sequentially to Supabase Storage
 */
export const uploadMultipleFilesToStorage = async (
  files: File[],
  options?: UploadOptions
): Promise<{ urls: string[]; errors: string[] }> => {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadFileToStorage(file, options);
    if (result.url) {
      urls.push(result.url);
    }
    if (result.error) {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  return { urls, errors };
};
