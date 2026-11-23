/**
 * 画像処理関連のユーティリティ
 */

/**
 * サポートされている画像タイプ
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
] as const;

/**
 * 最大ファイルサイズ（10MB）
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Content-Typeの有効性をチェックする
 */
export function validateImageContentType(contentType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.some((type) => type === contentType);
}

/**
 * 画像用のR2キーを生成する
 */
export function generateImageKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  return `cards/${userId}/${timestamp}-${randomId}${extension}`;
}

export function cardImageUrl(imageKey: string | null | undefined, baseUrl?: string): string | null {
  if (!imageKey) return null;
  const path = `/cards/image/${imageKey}`;
  return baseUrl ? new URL(path, baseUrl).href : path;
}
