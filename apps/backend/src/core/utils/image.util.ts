/**
 * Verilen objectName'in uzantısını kaldırıp sonuna suffix ekler.
 *
 * Örnek:
 *   deriveObjectName('products/abc/image.webp', '-thumbnail.webp') → 'products/abc/image-thumbnail.webp'
 *   deriveObjectName('products/abc/image.jpg', '-og-image.jpeg')   → 'products/abc/image-og-image.jpeg'
 */
export function deriveObjectName(objectName: string, suffix: string): string {
  return objectName.replace(/\.[^/.]+$/, '') + suffix;
}
