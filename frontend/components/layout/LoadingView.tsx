import type { ReactNode } from 'react';
import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from 'react-native';

type LoadingViewProps = {
  /** スピナー下の文言（例: 「読み込み中...」） */
  message: string;
  /** スピナーの色 */
  color?: string;
  /** 外側の View の className */
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** 文言の className */
  textClassName?: string;
  /** 文言の下に追加で表示するもの（戻るボタンなど） */
  children?: ReactNode;
};

/** 画面全体のローディング表示（大きいスピナー＋文言） */
export function LoadingView({
  message,
  color = '#000000',
  className = 'flex-1 items-center justify-center',
  style,
  textClassName = 'mt-4 text-lg',
  children,
}: LoadingViewProps) {
  return (
    <View className={className} style={style}>
      <ActivityIndicator size="large" color={color} />
      <Text className={textClassName}>{message}</Text>
      {children}
    </View>
  );
}
