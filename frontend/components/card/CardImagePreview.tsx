import { Image, Text, View } from 'react-native';
import { CARD_ASPECT_RATIO } from '../../constants/card';

type CardImagePreviewProps = {
  imageUri?: string | null;
  /** 表示幅（高さは名刺比率から計算） */
  width?: number;
};

/** 名刺作成フローの名刺画像プレビュー（画像がなければ灰色の枠） */
export function CardImagePreview({ imageUri, width = 280 }: CardImagePreviewProps) {
  return (
    <View className="items-center">
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="border border-gray-300 rounded-lg shadow-sm"
          style={{
            width,
            height: Math.round(width / CARD_ASPECT_RATIO), // 名刺比率を維持
            aspectRatio: CARD_ASPECT_RATIO
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="bg-gray-100 border border-gray-300 rounded-lg items-center justify-center"
          style={{
            width,
            height: Math.round(width / CARD_ASPECT_RATIO),
          }}
        >
          <Text className="text-gray-400">名刺画像</Text>
        </View>
      )}
    </View>
  );
}
