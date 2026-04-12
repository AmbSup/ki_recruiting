import { metaFetch, AD_ACCOUNT_ID } from './client';

interface AdImagesResponse {
  images: Record<string, { hash: string; url: string }>;
}

/**
 * Upload a base64-encoded image to Meta and return its image_hash.
 * The hash is required when creating ad creatives.
 *
 * @param imageBase64 - Pure base64 string (no data URI prefix)
 * @param filename - Filename hint, e.g. "ad-image.jpg"
 */
export async function uploadImageToMeta(
  imageBase64: string,
  filename: string = 'image.jpg'
): Promise<string> {
  const result = await metaFetch<AdImagesResponse>(`${AD_ACCOUNT_ID}/adimages`, {
    method: 'POST',
    body: {
      bytes: imageBase64,
      name: filename,
    },
  });

  const entries = Object.values(result.images ?? {});
  if (!entries.length || !entries[0].hash) {
    throw new Error('Meta image upload returned no hash');
  }
  return entries[0].hash;
}
