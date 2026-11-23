import { router } from 'expo-router';
import { Alert } from 'react-native';
import { isNetworkError, isServerError, isTimeoutError } from './errors';

/** 「入力エラー」アラート（OK ボタンのみ） */
export function showInputError(message: string): void {
  Alert.alert('入力エラー', message, [{ text: 'OK', style: 'default' }]);
}

/** 「再試行」「キャンセル」の2ボタンを持つアラート */
export function showRetryAlert(title: string, message: string, onRetry: () => void): void {
  Alert.alert(title, message, [
    { text: '再試行', onPress: onRetry },
    { text: 'キャンセル', style: 'cancel' },
  ]);
}

/**
 * 接続エラー・タイムアウト・サーバーエラー(500)の共通アラート。
 * いずれかに当てはまってアラートを出した場合は true を返す。
 */
export function handleCommonNetworkError(error: unknown, onRetry: () => void): boolean {
  if (isNetworkError(error)) {
    showRetryAlert('接続エラー', 'インターネット接続を確認してから、もう一度お試しください。', onRetry);
    return true;
  }
  if (isTimeoutError(error)) {
    showRetryAlert(
      'タイムアウトエラー',
      'サーバーへの接続がタイムアウトしました。しばらく時間をおいてから再度お試しください。',
      onRetry
    );
    return true;
  }
  if (isServerError(error)) {
    Alert.alert(
      'サーバーエラー',
      'サーバーで一時的な問題が発生しています。しばらく時間をおいてから再度お試しください。',
      [{ text: 'OK', style: 'default' }]
    );
    return true;
  }
  return false;
}

/** Error 型でない例外が来たときのアラート */
export function showUnexpectedErrorAlert(): void {
  Alert.alert(
    '予期しないエラー',
    '予期しないエラーが発生しました。アプリを再起動してからお試しください。',
    [{ text: 'OK', style: 'default' }]
  );
}

type ConfirmAlertOptions = {
  title: string;
  message: string;
  /** 実行ボタンの文言（例: 「削除」「ログアウト」） */
  confirmText: string;
  /** キャンセルボタンの文言 */
  cancelText?: string;
  /** 実行ボタンを destructive（赤字）にするか */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** 「キャンセル」「実行」の確認アラート（キャンセルが先） */
export function confirmAlert({
  title,
  message,
  confirmText,
  cancelText = 'キャンセル',
  destructive = true,
  onConfirm,
}: ConfirmAlertOptions): void {
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

/** OK を押すと前の画面に戻るアラート */
export function alertAndGoBack(title: string, message: string): void {
  Alert.alert(title, message, [{ text: 'OK', onPress: () => router.back() }]);
}
