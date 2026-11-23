import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import { confirmAlert } from '@/utils/alert';

export default function MyPage() {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    confirmAlert({
      title: 'ログアウト確認',
      message: 'ログアウトしますか？',
      confirmText: 'ログアウト',
      onConfirm: async () => {
        try {
          await logout();
          router.replace('/');
        } catch (error) {
          console.error('Logout error:', error);
          Alert.alert('エラー', 'ログアウトに失敗しました。');
        }
      },
    });
  };

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      {/* ユーザーのメールのみ表示 */}
      <Text className="text-lg mb-6">{user?.email || ''}</Text>

      <Pressable onPress={handleLogout} className="bg-red-500 px-8 py-4 rounded-lg">
        <Text className="text-white font-bold text-lg">ログアウト</Text>
      </Pressable>
    </View>
  );
}
