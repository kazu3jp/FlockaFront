import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';
import { apiClient, type CollectionItem } from '@/utils/api';

type ItemSize = {
  width: number;
  imageHeight: number;
};

const ITEM_MARGIN_STYLE = { marginVertical: 12, marginHorizontal: 6 } as const;

/** コレクションの1枚（タップで詳細へ） */
export function CollectionGridItem({ item, width, imageHeight }: ItemSize & { item: CollectionItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/card-detail?id=${item.id}`)}
      style={{
        width,
        ...ITEM_MARGIN_STYLE,
        borderWidth: 0,
        backgroundColor: '#fff',
        borderRadius: 4,
        overflow: 'hidden',
        // shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        // elevation for Android
        elevation: 3,
      }}
    >
      <Image
        source={{ uri: apiClient.resolveCardImageUrl(item.card.image_url, item.card.image_key) }}
        style={{ width: '100%', height: imageHeight }}
        resizeMode="cover"
      />
    </Pressable>
  );
}

/** ページの空き枠を埋めるグレーの枠 */
export function CollectionGridPlaceholder({ width, imageHeight }: ItemSize) {
  return (
    <View
      style={{
        width,
        height: imageHeight,
        ...ITEM_MARGIN_STYLE,
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
      }}
    />
  );
}
