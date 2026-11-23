import type { ReactElement } from 'react';
import { Pressable, RefreshControlProps, ScrollView, Text, View } from 'react-native';

type CollectionErrorViewProps = {
  message: string;
  onRetry: () => void;
};

/** 取得エラー時の表示（再試行ボタン付き） */
export function CollectionErrorView({ message, onRetry }: CollectionErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="text-red-500 text-center mb-4">{message}</Text>
      <Pressable onPress={onRetry} className="bg-blue-500 px-4 py-2 rounded">
        <Text className="text-white">再試行</Text>
      </Pressable>
    </View>
  );
}

type CollectionEmptyViewProps = {
  refreshControl: ReactElement<RefreshControlProps>;
};

/** まだ1枚も集めていないときの表示（引っぱって更新できる） */
export function CollectionEmptyView({ refreshControl }: CollectionEmptyViewProps) {
  return (
    <ScrollView contentContainerStyle={{ flex: 1 }} refreshControl={refreshControl}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500 text-center">
          まだカードが収集されていません。{'\n'}
          QR交換でカードを集めてみましょう！
        </Text>
      </View>
    </ScrollView>
  );
}
