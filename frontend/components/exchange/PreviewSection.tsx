import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type PreviewSectionProps = {
  title: string;
  children: ReactNode;
  /** 外枠の下余白など（既定: mb-4） */
  className?: string;
  /** 見出しの下余白（既定: mb-2） */
  titleClassName?: string;
};

/** 名刺プレビュー内の白いカード（見出し＋内容） */
export function PreviewSection({ title, children, className = 'mb-4', titleClassName = 'mb-2' }: PreviewSectionProps) {
  return (
    <View className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <Text className={`text-lg font-semibold text-gray-800 ${titleClassName}`}>{title}</Text>
      {children}
    </View>
  );
}
