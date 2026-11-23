/** `error instanceof Error ? error.message : fallback` の共通化 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** エラーメッセージにいずれかの文字列が含まれているか */
export function errorMessageIncludes(error: unknown, ...needles: string[]): boolean {
  if (!(error instanceof Error)) return false;
  return needles.some((needle) => error.message.includes(needle));
}

/** 通信エラー（ネットワーク未接続など） */
export function isNetworkError(error: unknown): boolean {
  return errorMessageIncludes(error, 'Network request failed', 'fetch');
}

/** タイムアウト */
export function isTimeoutError(error: unknown): boolean {
  return errorMessageIncludes(error, 'timeout');
}

/** サーバーエラー（500） */
export function isServerError(error: unknown): boolean {
  return errorMessageIncludes(error, '500', 'Internal Server Error');
}
