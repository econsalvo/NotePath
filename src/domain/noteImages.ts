export const ALLOWED_NOTE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const

export const MAX_NOTE_IMAGE_BYTES = 10 * 1024 * 1024

export function validateNoteImage(file: { size: number; type: string }) {
  if (!(ALLOWED_NOTE_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error('Paste a PNG, JPEG, GIF, or WebP image.')
  }
  if (file.size <= 0 || file.size > MAX_NOTE_IMAGE_BYTES) {
    throw new Error('Images must be 10 MB or smaller.')
  }
}
