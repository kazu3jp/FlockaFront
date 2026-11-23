import { View } from 'react-native';

type PageDotsProps = {
  count: number;
  current: number;
};

/** ページャーのドットインジケータ（2ページ以上のときだけ表示） */
export function PageDots({ count, current }: PageDotsProps) {
  if (count <= 1) return null;

  return (
    <View className="flex-row justify-center absolute bottom-40">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className={`w-2.5 h-2.5 rounded-full mx-1.5 ${index === current ? 'bg-gray-500' : 'bg-gray-300'}`}
        />
      ))}
    </View>
  );
}
