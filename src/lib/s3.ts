import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'justicehub-media';
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN;

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
}

/**
 * Uploads a file to S3
 * @param file - The file buffer
 * @param fileName - Original file name
 * @param fileType - MIME type of the file
 * @param folder - S3 folder path (e.g., 'stories', 'profiles')
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  fileType: string,
  folder: string
): Promise<UploadResult> {
  const fileExtension = fileName.split('.').pop();
  const key = `${folder}/${uuidv4()}.${fileExtension}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: fileType,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(params).promise();
    
    return {
      key,
      url: result.Location,
      cdnUrl: CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${key}` : undefined,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Deletes a file from S3
 * @param key - The S3 object key
 */
export async function deleteFromS3(key: string): Promise<void> {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Gets a signed URL for temporary access to a private file
 * @param key - The S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Validates file size and type
 * @param fileSize - Size in bytes
 * @param fileType - MIME type
 * @param uploadType - Type of upload (profile_picture, story_media, etc.)
 */
export function validateFile(
  fileSize: number,
  fileType: string,
  uploadType: string
): { valid: boolean; error?: string } {
  const MAX_SIZES: Record<string, number> = {
    profile_picture: 5 * 1024 * 1024, // 5MB
    story_media: 100 * 1024 * 1024, // 100MB
    document: 20 * 1024 * 1024, // 20MB
    logo: 2 * 1024 * 1024, // 2MB
  };

  const ALLOWED_TYPES: Record<string, string[]> = {
    profile_picture: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    story_media: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
    ],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    logo: ['image/jpeg', 'image/png', 'image/svg+xml'],
  };

  const maxSize = MAX_SIZES[uploadType] || 10 * 1024 * 1024; // Default 10MB
  const allowedTypes = ALLOWED_TYPES[uploadType] || [];

  if (fileSize > maxSize) {
    return { valid: false, error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(fileType)) {
    return { valid: false, error: `File type ${fileType} is not allowed` };
  }

  return { valid: true };
}