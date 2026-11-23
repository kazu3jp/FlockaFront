import { AuthCardButton, AuthCardLinkButton } from '@/components/form/AuthCardButton';
import { AuthCardInput } from '@/components/form/AuthCardInput';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { showInputError } from '@/utils/alert';
import { apiClient } from '@/utils/api';
import { isPasswordLongEnough } from '@/utils/validation';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const initialToken = typeof params.token === 'string' ? params.token : '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      showInputError('メールに記載されたトークンを入力してください。');
      return;
    }
    if (!isPasswordLongEnough(password)) {
      showInputError('パスワードは8文字以上で設定してください。');
      return;
    }
    if (password !== confirm) {
      showInputError('パスワードが一致しません。');
      return;
    }

    try {
      setLoading(true);
      await apiClient.resetPassword(token.trim(), password);
      Alert.alert('完了', 'パスワードを更新しました。ログインしてください。', [
        { text: 'ログインへ', onPress: () => router.replace('/sign-in') }
      ]);
    } catch (error) {
      console.error('Reset password failed:', error);
      Alert.alert('失敗', 'パスワードのリセットに失敗しました。トークンの有効期限を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      title="パスワードを再設定する"
      subtitle="メールに記載されたトークンと新しいパスワードを入力してください。"
    >
      <AuthCardInput
        placeholder="メールのトークン"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
      />
      <AuthCardInput
        placeholder="新しいパスワード (8文字以上)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <AuthCardInput
        placeholder="確認のため再入力"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      <AuthCardButton title="パスワードを更新する" onPress={handleReset} loading={loading} />
      <AuthCardLinkButton title="ログインへ戻る" onPress={() => router.replace('/sign-in')} />
    </AuthCardLayout>
  );
}
