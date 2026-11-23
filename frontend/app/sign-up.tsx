import { AuthPrimaryButton, AuthSecondaryButton } from '@/components/form/AuthButtons';
import { AuthTextField } from '@/components/form/AuthTextField';
import { PasswordField } from '@/components/form/PasswordField';
import { AppLogo } from '@/components/layout/AppLogo';
import { handleCommonNetworkError, showInputError, showUnexpectedErrorAlert } from '@/utils/alert';
import { apiClient } from '@/utils/api';
import { errorMessageIncludes } from '@/utils/errors';
import { getCredentialsInputError } from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from "react";
import { Alert, View } from "react-native";

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /** 登録失敗時のアラート（上から順に判定する） */
  const showSignUpError = (error: unknown) => {
    if (!(error instanceof Error)) {
      showUnexpectedErrorAlert();
      return;
    }

    if (errorMessageIncludes(error, 'Email already exists', 'already registered')) {
      Alert.alert(
        "登録エラー",
        "このメールアドレスは既に登録されています。\n\n• 別のメールアドレスで登録してください\n• 既にアカウントをお持ちの場合はログイン画面をご利用ください",
        [
          { text: "ログイン画面へ", onPress: () => router.navigate('/sign-in') },
          { text: "再入力", style: "cancel" }
        ]
      );
      return;
    }

    if (errorMessageIncludes(error, 'Invalid email format')) {
      showInputError("正しいメールアドレスの形式で入力してください。");
      return;
    }

    if (errorMessageIncludes(error, 'Password must be at least')) {
      showInputError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (errorMessageIncludes(error, 'Name is required')) {
      showInputError("名前を入力してください。");
      return;
    }

    // 接続エラー・タイムアウト・サーバーエラー(500)
    if (handleCommonNetworkError(error, () => handleSignUp())) return;

    // その他のエラー
    Alert.alert(
      "登録エラー",
      "アカウントの登録に失敗しました。しばらく時間をおいてから再度お試しください。",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleSignUp = async () => {
    const inputError = getCredentialsInputError(email, password, {
      bothEmptyMessage: "すべての項目を入力してください。",
      checkPasswordLength: true,
    });
    if (inputError) {
      showInputError(inputError);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.register(email.trim(), null, password);

      // 登録成功時はメール認証画面へ
      router.replace({
        pathname: '/sign-up-auth',
        params: { email: email.trim() }
      });
    } catch (error) {
      console.error('Registration error:', error);
      showSignUpError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
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
          iconSize={28}
          toggleHitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          toggleStyle={{ padding: 8 }}
        />
      </View>
      <View className='w-full px-16 mt-16'>
        <AuthPrimaryButton title="新規登録" onPress={handleSignUp} loading={isLoading} />
      </View>
      <View className='w-full px-16'>
        <AuthSecondaryButton title="ログインはこちら" onPress={() => router.navigate('/sign-in')} />
      </View>
    </View>
  );
}
