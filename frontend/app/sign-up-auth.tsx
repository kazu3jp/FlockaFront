import { AuthCardButton, AuthCardLinkButton } from '@/components/form/AuthCardButton';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { confirmAlert } from '@/utils/alert';
import { apiClient } from '@/utils/api';
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

/** 認証メールを再送できるようになるまでの秒数 */
const COOLDOWN_SECONDS = 60;

export default function SignUpAuth() {
  const { user, logout } = useAuth();
  const { email: enteredEmail } = useLocalSearchParams<{ email?: string }>();
  const email = user?.email ?? enteredEmail;
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // 再送クールダウンのカウントダウン（1秒ごとに1減らし、0で止まる）
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((s) => Math.max(s - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    if (!email) {
      confirmAlert({
        title: 'ユーザー情報がありません',
        message: 'サインアップ画面からメールアドレスを入力してください。',
        confirmText: 'サインアップへ',
        destructive: false,
        onConfirm: () => router.push('/sign-up'),
      });
      return;
    }

    if (cooldownSeconds > 0) {
      Alert.alert('お待ちください', `認証メールはあと ${cooldownSeconds} 秒後に再送可能です。`);
      return;
    }

    try {
      setLoading(true);
      await apiClient.resendVerificationEmail(email);
      Alert.alert('送信受付', '認証が必要な場合はメールが届きます。メールボックスを確認してください。');
      setCooldownSeconds(COOLDOWN_SECONDS);
    } catch (error) {
      console.error('Resend verification failed:', error);
      Alert.alert('送信失敗', '認証メールの再送に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAndSignup = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace('/sign-up');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('エラー', 'ログアウトに失敗しました。');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AuthCardLayout title="メール認証を完了してください" subtitle={email ?? '—'} subtitleMarginBottom={20}>
      <AuthCardButton
        title={cooldownSeconds > 0 ? `再送まで待つ（${cooldownSeconds}s）` : '認証メールを再送する'}
        onPress={handleResend}
        loading={loading}
        disabled={cooldownSeconds > 0}
        marginBottom={12}
      />
      <AuthCardButton
        title="別のメールで登録し直す（ログアウト）"
        onPress={handleLogoutAndSignup}
        loading={loggingOut}
        variant="outline"
      />
      <AuthCardLinkButton title="ホームへ" onPress={() => router.replace('/')} />
    </AuthCardLayout>
  );
}
