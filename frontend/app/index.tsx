import { AuthPrimaryButton, AuthSecondaryButton } from '@/components/form/AuthButtons';
import { AppLogo } from '@/components/layout/AppLogo';
import { LoadingView } from '@/components/layout/LoadingView';
import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from "react-native";
import "../global.css";

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    // メール認証済みならホーム画面へ、未完了なら認証画面へ
    router.replace(user.email_verified ? '/(tabs)/home' : '/sign-up-auth');
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return <LoadingView message="読み込み中..." />;
  }

  // 未認証の場合はスタート画面を表示
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <AppLogo className="items-center mb-20" />
      <View className='w-full px-16'>
        <AuthPrimaryButton title="新規登録" onPress={() => router.navigate('/sign-up')} />
      </View>
      <View className='w-full px-16 '>
        <AuthSecondaryButton title="ログイン" onPress={() => router.navigate('/sign-in')} outlined />
      </View>
      <View className='flex-row mt-8'>
        {/* TODO: 利用規約・プライバシーポリシーのページができたら遷移させる */}
        <Pressable>
          <Text className='text-xs underline'>利用規約</Text>
        </Pressable>
        <Text className="text-xs"> と </Text>
        <Pressable>
          <Text className='text-xs underline'>プライバシーポリシー</Text>
        </Pressable>
        <Text className="text-xs">に同意してflockaを利用します。</Text>
      </View>
    </View>
  );
}
