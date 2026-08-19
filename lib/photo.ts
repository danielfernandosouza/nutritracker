/** ~2MB of raw image bytes, expressed as the base64 string length (base64 is ~4/3 the byte size). */
export const MAX_PHOTO_BASE64_LENGTH = 2_800_000;

export function isPhotoTooLarge(photo: string | null | undefined): boolean {
  return typeof photo === "string" && photo.length > MAX_PHOTO_BASE64_LENGTH;
}
