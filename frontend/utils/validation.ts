/** 簡単なメールアドレスの形式チェック用 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** パスワードの最小文字数 */
export const MIN_PASSWORD_LENGTH = 8;

/** 前後の空白を除いてメールアドレスの形式をチェックする */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/** パスワードが最小文字数を満たしているか */
export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

type CredentialsCheckOptions = {
  /** メールアドレスとパスワードの両方が空のときのメッセージ */
  bothEmptyMessage: string;
  /** true のときパスワードの文字数（8文字以上）もチェックする */
  checkPasswordLength?: boolean;
};

/**
 * ログイン・新規登録フォームの入力チェック。
 * 問題があれば「入力エラー」として表示するメッセージを返し、問題なければ null を返す。
 */
export function getCredentialsInputError(
  email: string,
  password: string,
  { bothEmptyMessage, checkPasswordLength = false }: CredentialsCheckOptions
): string | null {
  const hasEmail = !!email.trim();
  const hasPassword = !!password.trim();

  if (!hasEmail && !hasPassword) return bothEmptyMessage;
  if (!hasEmail) return 'メールアドレスを入力してください。';
  if (!hasPassword) return 'パスワードを入力してください。';

  if (!isValidEmail(email)) {
    return '正しいメールアドレスの形式で入力してください。\n例: user@example.com';
  }

  if (checkPasswordLength && !isPasswordLongEnough(password)) {
    return 'パスワードは8文字以上で入力してください。';
  }

  return null;
}
