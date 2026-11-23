import { AuthCardButton, AuthCardLinkButton } from '@/components/form/AuthCardButton';
import { AuthCardInput } from '@/components/form/AuthCardInput';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { showInputError } from '@/utils/alert';
import { apiClient } from '@/utils/api';
import { isValidEmail } from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      showInputError('有効なメールアドレスを入力してください。');
      return;
    }

    try {
      setLoading(true);
      await apiClient.forgotPassword(trimmed);
      Alert.alert('送信完了', 'パスワードリセット用のメールを送信しました。メールを確認してください。', [
        { text: 'ログインへ', onPress: () => router.replace('/sign-in') }
      ]);
    } catch (error) {
      console.error('Forgot password failed:', error);
      Alert.alert('送信失敗', 'パスワードリセットの送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      title="パスワードをリセットする"
      subtitle="登録済みメールアドレスを入力してください。リセット用のメールを送信します。"
    >
      <AuthCardInput
        placeholder="sample@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <AuthCardButton title="リセットメールを送信する" onPress={handleRequest} loading={loading} />
      <AuthCardLinkButton title="ログインへ戻る" onPress={() => router.replace('/sign-in')} />
    </AuthCardLayout>
  );
}
