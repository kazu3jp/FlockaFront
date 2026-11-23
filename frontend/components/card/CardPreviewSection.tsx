import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { CardImagePreview } from './CardImagePreview';

type CardPreviewSectionProps = {
  imageUri?: string | null;
  /** 画像の下に表示するもの（入力済みの基本情報など） */
  children?: ReactNode;
};

/** 名刺作成フロー上部の「名刺プレビュー」見出し＋画像 */
export function CardPreviewSection({ imageUri, children }: CardPreviewSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3">名刺プレビュー</Text>
      <CardImagePreview imageUri={imageUri} />
      {children}
    </View>
  );
}
