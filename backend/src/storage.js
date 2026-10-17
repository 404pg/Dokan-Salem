// backend/src/storage.js
// Cloudflare R2 object storage helper for product images.
// Reads credentials from environment variables (see backend/.env).

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const R2_REGION = process.env.R2_REGION || 'auto';

export function isR2Configured() {
  return Boolean(
    R2_ENDPOINT &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET &&
    R2_PUBLIC_BASE_URL
  );
}

if (!isR2Configured()) {
  console.warn('[storage] R2 environment variables are incomplete. Image uploads to R2 will fail.');
}

const s3 = isR2Configured()
  ? new S3Client({
      region: R2_REGION,
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function buildImageKey(mimeType, originalName) {
  const extFromMime = MIME_TO_EXT[mimeType];
  const extFromName = originalName
    ? path.extname(originalName).replace('.', '').toLowerCase()
    : '';
  const ext = extFromMime || extFromName || 'bin';

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

  return `products/${yyyy}/${mm}/${randomUUID()}.${ext}`;
}

/**
 * Upload an image buffer to R2.
 * @param {Buffer} buffer
 * @param {{ mimeType: string, originalName?: string }} options
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadImage(buffer, { mimeType, originalName }) {
  if (!s3) {
    throw new Error('R2 is not configured. Check backend/.env R2_* variables.');
  }
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('uploadImage: buffer is required.');
  }
  if (!mimeType) {
    throw new Error('uploadImage: mimeType is required.');
  }

  const key = buildImageKey(mimeType, originalName);

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const url = `${R2_PUBLIC_BASE_URL}/${key}`;
  return { url, key };
}

/**
 * Delete an object from R2 by key.
 * @param {string} key
 */
export async function deleteImage(key) {
  if (!s3) {
    throw new Error('R2 is not configured. Check backend/.env R2_* variables.');
  }
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}