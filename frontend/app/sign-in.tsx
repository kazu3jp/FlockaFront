import { AuthPrimaryButton, AuthSecondaryButton } from '@/components/form/AuthButtons';
import { AuthTextField } from '@/components/form/AuthTextField';
import { PasswordField } from '@/components/form/PasswordField';
import { AppLogo } from '@/components/layout/AppLogo';
import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import { handleCommonNetworkError, showInputError, showUnexpectedErrorAlert } from '@/utils/alert';
import { errorMessageIncludes } from '@/utils/errors';
import { getCredentialsInputError } from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();

  /** ログイン失敗時のアラート（上から順に判定する） */
  const showSignInError = (error: unknown) => {
    if (!(error instanceof Error)) {
      showUnexpectedErrorAlert();
      return;
    }

    if (errorMessageIncludes(error, 'Please verify your email')) {
      // メール認証が必要な場合は専用ページに遷移
      Alert.alert(
        "メール認証が必要です",
        "ログインにはメールアドレスの認証が必要です。認証を完了してからログインしてください。",
        [
          {
            text: "認証画面へ",
            onPress: () => {
              router.replace({
                pathname: '/sign-up-auth',
                params: { email: email.trim() }
              });
            }
          },
          { text: "キャンセル", style: "cancel" }
        ]
      );
      return;
    }

    if (errorMessageIncludes(error, 'Invalid email or password')) {
      Alert.alert(
        "ログイン失敗",
        "メールアドレスまたはパスワードが正しくありません。\n\n• パスワードが間違っている可能性があります\n• 大文字・小文字も正確に入力してください\n• アカウントが存在しない可能性があります",
        [
          {
            text: "パスワードを忘れた場合",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "パスワードリセット",
                "パスワードリセット機能は現在準備中です。サポートにお問い合わせください。",
                [{ text: "OK", style: "default" }]
              );
            }
          },
          { text: "再入力", style: "default" }
        ]
      );
      return;
    }

    if (errorMessageIncludes(error, 'Email and password are required')) {
      showInputError("メールアドレスとパスワードを入力してください。");
      return;
    }

    // 接続エラー・タイムアウト・サーバーエラー(500)
    if (handleCommonNetworkError(error, () => handleSignIn())) return;

    if (errorMessageIncludes(error, '403', 'Forbidden')) {
      Alert.alert(
        "アクセスエラー",
        "アカウントがロックされているか、アクセスが制限されています。",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    // その他のエラー
    Alert.alert(
      "ログインエラー",
      "ログインできませんでした。しばらく時間をおいてから再度お試しください。",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleSignIn = async () => {
    const inputError = getCredentialsInputError(email, password, {
      bothEmptyMessage: "メールアドレスとパスワードを入力してください。",
    });
    if (inputError) {
      showInputError(inputError);
      return;
    }

    setIsLoading(true);
    try {
      // ログイン成功時はアラートを表示せず、AuthContext が自動的にリダイレクトする
      await login(email.trim(), password);
    } catch (error) {
      console.error('Login error:', error);
      showSignInError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <AppLogo />
      <View className="w-full px-16 mt-4">
        <AuthTextField
          label="メールアドレス"
          placeholder="sample@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PasswordField
          className="mt-6"
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => router.push({ pathname: '/forgot-password' })}>
          <Text className="text-sm mt-3 text-right text-blue-400">パスワードを忘れた方</Text>
        </Pressable>
      </View>
      <View className='w-full px-16 mt-12'>
        <AuthPrimaryButton title="ログイン" onPress={handleSignIn} loading={isLoading} />
      </View>
      <View className='w-full px-16'>
        <AuthSecondaryButton title="新規登録はこちら" onPress={() => router.navigate('/sign-up')} />
      </View>
    </View>
  );
}
