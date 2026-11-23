import { ActivityIndicator, Pressable, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type LoadingButtonProps = {
  /** 通常時の文言（例: 「削除」） */
  label: string;
  /** 処理中の文言（例: 「削除中...」） */
  loadingLabel: string;
  loading: boolean;
  onPress: () => void;
  /** 省略時は loading と同じ */
  disabled?: boolean;
  /** ボタン本体の className（背景色・余白など） */
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** 文字の className。通常時は末尾に text-center、処理中は ml-2 が付く */
  textClassName?: string;
  /** 'opacity': TouchableOpacity（押すと薄くなる）/ 'none': Pressable */
  pressFeedback?: 'opacity' | 'none';
};

/** 「スピナー＋〇〇中...」に切り替わる白文字ボタン */
export function LoadingButton({
  label,
  loadingLabel,
  loading,
  onPress,
  disabled,
  className,
  style,
  textClassName = 'text-white font-bold',
  pressFeedback = 'none',
}: LoadingButtonProps) {
  const content = loading ? (
    <View className="flex-row items-center justify-center">
      <ActivityIndicator size="small" color="white" />
      <Text className={`${textClassName} ml-2`}>{loadingLabel}</Text>
    </View>
  ) : (
    <Text className={`${textClassName} text-center`}>{label}</Text>
  );

  const isDisabled = disabled ?? loading;

  if (pressFeedback === 'opacity') {
    return (
      <TouchableOpacity onPress={onPress} className={className} style={style} disabled={isDisabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <Pressable onPress={onPress} className={className} style={style} disabled={isDisabled}>
      {content}
    </Pressable>
  );
}
